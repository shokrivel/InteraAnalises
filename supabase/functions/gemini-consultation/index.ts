import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { consultationData, userId } = await req.json();
    console.log('Consultation data received:', consultationData);
    console.log('User ID:', userId);

    // Get user profile to determine knowledge level
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('profile_type, name')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error('Erro ao buscar perfil do usuário');
    }

    console.log('User profile:', profile);

    // Create system prompt based on user profile
    let systemPrompt = '';
    let responseLevel = '';

    switch (profile.profile_type) {
      case 'patient':
        systemPrompt = `Você é um assistente médico especializado em Parasitologia, Hematologia e Bioquímica. 
        Responda ao paciente de forma clara, didática e tranquilizadora, usando linguagem simples e acessível. 
        Evite termos técnicos complexos. Forneça explicações educativas e, quando apropriado, 
        recomende buscar acompanhamento médico presencial. Seja empático e cuidadoso.`;
        responseLevel = 'Paciente';
        break;
      
      case 'academic':
        systemPrompt = `Você é um assistente educacional especializado em Parasitologia, Hematologia e Bioquímica 
        para estudantes de medicina e ciências da saúde. Forneça explicações detalhadas com base científica, 
        incluindo mecanismos fisiopatológicos, diagnóstico diferencial e referências bibliográficas quando relevante. 
        Use terminologia médica apropriada e contextualize com casos clínicos.`;
        responseLevel = 'Acadêmico';
        break;
      
      case 'health_professional':
        systemPrompt = `Você é um consultor médico especializado em Parasitologia, Hematologia e Bioquímica 
        para profissionais de saúde. Forneça análises técnicas aprofundadas, diagnóstico diferencial completo, 
        recomendações de exames complementares, protocolos de tratamento baseados em evidências atuais 
        e considerações sobre manejo clínico. Use linguagem técnica especializada.`;
        responseLevel = 'Profissional de Saúde';
        break;
    }

    // Build consultation context
    let consultationContext = `Paciente: ${profile.name}\nNível de resposta: ${responseLevel}\n\nDados da consulta:\n`;
    
    Object.entries(consultationData).forEach(([key, value]) => {
      if (value && value !== '' && value !== false) {
        consultationContext += `${key}: ${value}\n`;
      }
    });

    // Build Gemini parts with text and any image attachments
    const parts: any[] = [
      {
        text: `${systemPrompt}\n\n${consultationContext}\n\nConsidere também as imagens anexadas (se houver) ao elaborar a análise.`
      }
    ];

    const attachments = Array.isArray(consultationData.exam_attachments) ? consultationData.exam_attachments : [];
    if (attachments.length) {
      console.log(`Found ${attachments.length} attachments. Preparing images for Gemini...`);

      const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
          binary += String.fromCharCode(...chunk);
        }
        return btoa(binary);
      };

      const imagePromises = attachments.map(async (att: any, idx: number) => {
        try {
          const mime = typeof att?.type === 'string' && att.type.includes('/') ? att.type : 'image/png';
          if (!(att?.path) && !(typeof att?.url === 'string' && att.url)) {
            console.warn('Skipping attachment without path/url at index', idx);
            return;
          }

          let blob: Blob | null = null;

          if (att?.path) {
            const { data: fileBlob, error: dlErr } = await supabaseAdmin
              .storage.from('consultation-attachments')
              .download(att.path);
            if (dlErr) {
              console.error('Failed to download attachment from storage:', dlErr, 'path:', att.path);
              return;
            }
            blob = fileBlob;
          } else if (att?.url) {
            // Fallback: try fetching the URL (may fail if bucket is private)
            const res = await fetch(att.url);
            if (!res.ok) {
              console.error('Failed to fetch attachment URL:', att.url, 'status:', res.status);
              return;
            }
            blob = await res.blob();
          }

          if (!blob) return;

          const base64 = arrayBufferToBase64(await blob.arrayBuffer());
          parts.push({
            inline_data: {
              mime_type: mime,
              data: base64,
            }
          });
          console.log(`Added image attachment part (${mime}) to Gemini request.`);
        } catch (e) {
          console.error('Error processing attachment index', idx, e);
        }
      });

      await Promise.all(imagePromises);
    }

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY não configurada');
    }

    console.log('Sending request to Gemini API with', parts.length, 'parts...');
    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    const data = await response.json();
    console.log('Gemini API response:', data);

    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(`Erro na API do Gemini: ${data.error?.message || 'Erro desconhecido'}`);
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiResponse) {
      throw new Error('Resposta inválida da API do Gemini');
    }

    // Save consultation to database
    const { data: consultationRecord, error: saveError } = await supabaseAdmin
      .from('consultation_history')
      .insert({
        user_id: userId,
        symptoms: consultationData.symptoms ? [consultationData.symptoms] : [],
        ai_response: aiResponse,
        symptom_duration: consultationData.symptom_duration ? parseInt(consultationData.symptom_duration) : null,
        exam_results: Object.keys(consultationData).length > 0 ? consultationData : null,
        epidemiological_info: {
          profile_type: profile.profile_type,
          consultation_fields: consultationData
        }
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving consultation:', saveError);
      // Don't throw error here, just log it - we still want to return the AI response
    }

    console.log('Consultation saved successfully:', consultationRecord?.id);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      consultationId: consultationRecord?.id,
      profileType: profile.profile_type 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in gemini-consultation function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});