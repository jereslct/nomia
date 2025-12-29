import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  to_email: string;
  organization_name: string;
  inviter_name: string;
  app_url: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-invitation-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to_email, organization_name, inviter_name, app_url }: InvitationEmailRequest = await req.json();

    console.log(`Sending invitation email to: ${to_email}`);
    console.log(`Organization: ${organization_name}, Inviter: ${inviter_name}`);

    const emailResponse = await resend.emails.send({
      from: "BeamInOut <onboarding@resend.dev>",
      to: [to_email],
      subject: `Te han invitado a unirte a ${organization_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitación a ${organization_name}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e4e4e7;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #18181b;">
                        🎉 ¡Estás invitado!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #3f3f46;">
                        Hola,
                      </p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #3f3f46;">
                        <strong>${inviter_name}</strong> te ha invitado a unirte a la organización <strong>"${organization_name}"</strong> en BeamInOut.
                      </p>
                      
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #3f3f46;">
                        BeamInOut es una plataforma de control de asistencia donde podrás registrar tu entrada y salida de forma fácil y rápida.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 24px;">
                            <a href="${app_url}/auth" 
                               style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                              Crear mi cuenta
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0; font-size: 14px; line-height: 20px; color: #71717a;">
                        Regístrate usando este correo electrónico (<strong>${to_email}</strong>) para unirte automáticamente a la organización.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #e4e4e7; border-radius: 0 0 12px 12px;">
                      <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a1a1aa; text-align: center;">
                        Si no esperabas esta invitación, puedes ignorar este correo.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
