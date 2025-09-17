import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { Resend } from 'npm:resend@4.0.0';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { RegistrationConfirmationEmail } from './_templates/registration-confirmation.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);
const hookSecret = Deno.env.get('AUTH_WEBHOOK_SECRET') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // Verify webhook signature if secret is provided
    if (hookSecret) {
      const wh = new Webhook(hookSecret);
      wh.verify(payload, headers);
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = JSON.parse(payload) as {
      user: {
        email: string;
        user_metadata?: {
          name?: string;
        };
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
      };
    };

    // Only handle signup confirmations
    if (email_action_type !== 'signup') {
      return new Response('Not a signup confirmation', { 
        status: 200,
        headers: corsHeaders
      });
    }

    const confirmationUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token}&type=${email_action_type}&redirect_to=${redirect_to || "https://interasaude.com.br/confirmado"}`;

    const html = await renderAsync(
      React.createElement(RegistrationConfirmationEmail, {
        userEmail: user.email,
        confirmationUrl,
        userName: user.user_metadata?.name,
      })
    );

    const { error } = await resend.emails.send({
      from: 'InteraSaúde <noreply@interasaude.com>',
      to: [user.email],
      subject: 'Confirme seu cadastro no InteraSaúde',
      html,
    });

    if (error) {
      console.error('Error sending registration confirmation email:', error);
      throw error;
    }

    console.log('Registration confirmation email sent successfully to:', user.email);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error in registration confirmation function:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
