import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Helper to get CORS headers with origin validation
function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = [
    Deno.env.get("APP_URL") || "",
    "http://localhost:5173",
    "http://localhost:8080",
  ].filter(Boolean);
  
  const allowedOrigin = origin && allowedOrigins.some(allowed => 
    origin === allowed || origin.endsWith(".lovable.app")
  ) ? origin : allowedOrigins[0] || "*";
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

interface InvitationEmailRequest {
  to_email: string;
  organization_name: string;
  inviter_name: string;
  app_url: string;
}

// HTML escape function to prevent XSS/HTML injection
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validate URL is from allowed origins
function isValidAppUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow https in production, http for localhost development
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return false;
    }
    // Block javascript: and data: URLs
    if (url.toLowerCase().startsWith("javascript:") || url.toLowerCase().startsWith("data:")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-invitation-email function called");

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client and verify the user
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      console.error("User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { to_email, organization_name, inviter_name, app_url }: InvitationEmailRequest = await req.json();

    // Input validation
    if (!to_email || !organization_name || !inviter_name || !app_url) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidEmail(to_email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidAppUrl(app_url)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid app URL" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate string lengths to prevent abuse
    if (organization_name.length > 100 || inviter_name.length > 100) {
      return new Response(
        JSON.stringify({ success: false, error: "Field length exceeds maximum" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending invitation email to: ${to_email} by admin: ${user.id}`);
    console.log(`Organization: ${organization_name}, Inviter: ${inviter_name}`);

    // Escape all user-controlled inputs for HTML context
    const safeOrgName = escapeHtml(organization_name);
    const safeInviterName = escapeHtml(inviter_name);
    const safeToEmail = escapeHtml(to_email);
    // app_url is validated and used in href, needs URL encoding for safety
    const safeAppUrl = encodeURI(app_url);

    const emailResponse = await resend.emails.send({
      from: "BeamInOut <onboarding@resend.dev>",
      to: [to_email],
      subject: `Te han invitado a unirte a ${safeOrgName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitación a ${safeOrgName}</title>
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
                        <strong>${safeInviterName}</strong> te ha invitado a unirte a la organización <strong>"${safeOrgName}"</strong> en BeamInOut.
                      </p>
                      
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #3f3f46;">
                        BeamInOut es una plataforma de control de asistencia donde podrás registrar tu entrada y salida de forma fácil y rápida.
                      </p>
                      
                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 24px;">
                            <a href="${safeAppUrl}/auth" 
                               style="display: inline-block; padding: 14px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
                              Crear mi cuenta
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0; font-size: 14px; line-height: 20px; color: #71717a;">
                        Regístrate usando este correo electrónico (<strong>${safeToEmail}</strong>) para unirte automáticamente a la organización.
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
      JSON.stringify({ success: false, error: "Failed to send invitation email" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
