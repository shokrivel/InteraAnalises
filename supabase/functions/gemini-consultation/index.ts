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

    const body = await req.json();
    console.log('Request body received:', body);
    
    const { 
      user_id, 
      symptoms, 
      attachments = [], 
      consulta_original_id,
      status = 'finalizada',
      original_consultation,
      consultationData,  // For backward compatibility
      userId,           // For backward compatibility
      ...additionalData 
    } = body;

    // Handle backward compatibility
    const actualUserId = user_id || userId;
    const actualConsultationData = consultationData || additionalData;

    // Get user profile to determine knowledge level
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('profile_type, name')
      .eq('user_id', actualUserId)
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
        systemPrompt = `Você é um assistente especializado em saúde, com foco em Parasitologia, Bioquímica e Hematologia. Suas respostas devem sempre se basear em literatura científica confiável (PubMed, LILACS, Science Direct e periódicos indexados). Respeite os limites de tempo das fontes: até 5 anos para Bioquímica/Hematologia e até 10 anos para Parasitologia. Utilizar nomes populares e colocar o nome técnico entre parênteses, por exemplo: exame de sangue (Hemograma). Respostas resumidas (até ~1500 tokens), tom acolhedor e natural, com temperatura simulada de 0,6–0,7. Referências não são obrigatórias. Evite termos técnicos complexos. Forneça explicações educativas e, quando apropriado, 
        recomende buscar acompanhamento médico presencial. Seja empático e cuidadoso. Após sugerir hipóteses diagnósticas, sempre indique profissionais da saúde próximos (médicos, farmacêuticos, biomédicos, laboratórios), utilizando a localização cadastrada pelo usuário. Essa etapa deve integrar-se com a Google Maps API. Se o perfil não for informado, solicite que o usuário selecione o perfil antes de gerar a resposta.`;
        responseLevel = 'Paciente';
        break;
      
      case 'academic':
        systemPrompt = `Você é um assistente especializado em saúde, com foco em Parasitologia, Bioquímica e Hematologia. Suas respostas devem sempre se basear em literatura científica confiável (PubMed, LILACS, Science Direct e periódicos indexados) para atender os estudantes de medicina e ciências da saúde. Respeite os limites de tempo das fontes: até 5 anos para Bioquímica/Hematologia e até 10 anos para Parasitologia. linguagem técnica intermediária, estilo de resumo científico. Respostas mais detalhadas (até ~2500 tokens), tom objetivo e técnico, com temperatura simulada de 0,5–0,6. Referências devem ser citadas de forma resumida no formato (Autor, Ano, Periódico). Após sugerir hipóteses diagnósticas, sempre indique profissionais da saúde próximos (médicos, farmacêuticos, biomédicos, laboratórios), utilizando a localização cadastrada pelo usuário. Essa etapa deve integrar-se com a Google Maps API. Se o perfil não for informado, solicite que o usuário selecione o perfil antes de gerar a resposta.`;
        responseLevel = 'Acadêmico';
        break;
      
      case 'health_professional':
        systemPrompt = `Você é um assistente especializado em saúde, com foco em Parasitologia, Bioquímica e Hematologia. Suas respostas devem sempre se basear em literatura científica confiável (PubMed, LILACS, Science Direct e periódicos indexados) para atender profissionais de saúde. Respeite os limites de tempo das fontes: até 5 anos para Bioquímica/Hematologia e até 10 anos para Parasitologia. linguagem científica avançada, com detalhamento técnico e terminologia específica. Respostas completas (até ~3500 tokens), tom focado e preciso, com temperatura simulada de 0,4–0,5. Referências obrigatórias em padrão ABNT, utilizando somente fontes atuais (até 5 anos para bioquímica/hematologia e até 10 anos para parasitologia). Após sugerir hipóteses diagnósticas, sempre indique profissionais da saúde próximos (médicos, farmacêuticos, biomédicos, laboratórios), utilizando a localização cadastrada pelo usuário. Essa etapa deve integrar-se com a Google Maps API. Se o perfil não for informado, solicite que o usuário selecione o perfil antes de gerar a resposta.`;
        responseLevel = 'Profissional de Saúde';
        break;
    }

    // Handle file attachments (download and convert to base64)
    let imageParts = [];
    console.log(`Processing ${attachments.length} attachments...`);
    
    for (const attachment of attachments) {
      try {
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('consultation-attachments')
          .download(attachment.path);
          
        if (downloadError) {
          console.error('Error downloading file:', downloadError);
          continue;
        }
        
        // Convert to base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        // Only process images for Gemini
        if (attachment.type?.startsWith('image/')) {
          imageParts.push({
            inline_data: {
              mime_type: attachment.type,
              data: base64
            }
          });
          console.log(`Added image attachment part (${attachment.name})`);
        }
      } catch (error) {
        console.error(`Error processing attachment ${attachment.name}:`, error);
      }
    }

    // Build consultation context
    let consultationContext = '';
    
    // Handle re-evaluation case
    if (consulta_original_id && original_consultation) {
      const originalDate = new Date(original_consultation.created_at).toLocaleDateString('pt-BR');
      const currentDate = new Date().toLocaleDateString('pt-BR');
      
      consultationContext = `REAVALIAÇÃO DE CONSULTA.
INFORMAÇÕES ORIGINAIS (Data: ${originalDate}):
- Sintomas: ${original_consultation.symptoms?.join(', ') || 'Não informado'}
- Prognóstico Anterior: ${original_consultation.ai_response || 'Não disponível'}
---
NOVAS INFORMAÇÕES (Data: ${currentDate}):
- Detalhes: ${symptoms?.join(', ') || 'Não informado'}
---
Analisando o histórico completo, forneça um novo prognóstico considerando a evolução do quadro.`;
    } else {
      // Regular consultation
      consultationContext = `Paciente: ${profile.name}\nNível de resposta: ${responseLevel}\n\nDados da consulta:\n`;
      
      if (symptoms && symptoms.length > 0) {
        consultationContext += `Sintomas: ${symptoms.join(', ')}\n`;
      }
      
      Object.entries(actualConsultationData).forEach(([key, value]) => {
        if (value && value !== '' && value !== false) {
          consultationContext += `${key}: ${value}\n`;
        }
      });
    }

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY não configurada');
    }

    console.log(`Sending request to Gemini API with ${1 + imageParts.length} parts...`);

    // Build request parts - start with text
    const requestParts = [
      {
        text: `${systemPrompt}\n\n${consultationContext}\n\nPor favor, forneça uma resposta completa e estruturada baseada nas informações fornecidas.`
      }
    ];

    // Add image parts if any
    requestParts.push(...imageParts);

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: requestParts
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
        user_id: actualUserId,
        symptoms: symptoms || (actualConsultationData.symptoms ? [actualConsultationData.symptoms] : []),
        ai_response: aiResponse,
        symptom_duration: actualConsultationData.symptom_duration ? parseInt(actualConsultationData.symptom_duration) : null,
        exam_results: Object.keys(actualConsultationData).length > 0 ? actualConsultationData : null,
        epidemiological_info: {
          profile_type: profile.profile_type,
          consultation_fields: actualConsultationData
        },
        attachments: attachments,
        consulta_original_id: consulta_original_id || null,
        status: status
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