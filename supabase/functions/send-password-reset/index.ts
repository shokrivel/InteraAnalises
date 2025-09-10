import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { PasswordResetEmail } from './_templates/password-reset.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Criar cliente Supabase com service role para acessar auth
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se o usuário existe
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw userError;
    }

    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      // Por segurança, sempre retornamos sucesso mesmo se o email não existir
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Se o email estiver cadastrado, você receberá as instruções de reset." 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Obter origem da requisição ou usar valor padrão
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://37217826-4f0d-4f8d-967e-c6060e63a013.lovableproject.com';
    
    // Gerar link de reset usando Supabase
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?redirect_to=${encodeURIComponent(origin + '/reset-password')}`
      }
    });

    if (resetError) {
      throw resetError;
    }

    // Buscar informações do perfil do usuário
    const { data: profileData } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    // Renderizar template do email
    const emailHtml = await renderAsync(
      React.createElement(PasswordResetEmail, {
        userEmail: email,
        resetUrl: resetData.properties.action_link,
        userName: profileData?.name,
      })
    );

    // Enviar email via Resend
    const emailResponse = await resend.emails.send({
      from: "InteraSaúde <onboarding@resend.dev>",
      to: [email],
      subject: "Redefinir senha - InteraSaúde",
      html: emailHtml,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    console.log("Password reset email sent successfully:", emailResponse.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email de redefinição enviado com sucesso!" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Erro interno do servidor",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);