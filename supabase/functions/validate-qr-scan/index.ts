import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  
  return signature === expectedB64;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error", code: "CONFIG_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const qrSigningSecret = supabaseServiceKey.slice(0, 32);

    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header", code: "AUTH_MISSING" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the JWT token
    const token = authHeader.replace("Bearer ", "");

    // Create admin client to verify the user
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user with the provided token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "AUTH_FAILED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { qr_code } = await req.json();
    if (!qr_code) {
      return new Response(
        JSON.stringify({ error: "qr_code required", code: "QR_MISSING" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Validating QR scan for user ${user.id}`);

    // Validate QR format: nomia:nonce|location_id|expires_at|signature
    if (!qr_code.startsWith("nomia:")) {
      return new Response(
        JSON.stringify({ 
          error: "Código QR inválido. Formato no reconocido.",
          code: "INVALID_FORMAT" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parts = qr_code.slice(6).split("|"); // Remove "nomia:" prefix
    if (parts.length !== 4) {
      return new Response(
        JSON.stringify({ 
          error: "Código QR inválido. Estructura incorrecta.",
          code: "INVALID_STRUCTURE" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [nonce, locationId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    const payload = `${nonce}|${locationId}|${expiresAtStr}`;

    // Verify signature
    const isValidSignature = await verifySignature(payload, signature, qrSigningSecret);
    if (!isValidSignature) {
      console.warn(`Invalid signature for QR scan by user ${user.id}`);
      return new Response(
        JSON.stringify({ 
          error: "Código QR manipulado o inválido.",
          code: "INVALID_SIGNATURE" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration (strict 30-second window)
    const now = Date.now();
    if (now > expiresAt) {
      const expiredAgo = Math.floor((now - expiresAt) / 1000);
      console.warn(`Expired QR used by user ${user.id}, expired ${expiredAgo}s ago`);
      return new Response(
        JSON.stringify({ 
          error: `Código QR expirado hace ${expiredAgo} segundos. Solicita uno nuevo.`,
          code: "QR_EXPIRED" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify QR exists in database and matches
    const { data: qrData, error: qrError } = await supabaseAdmin
      .from("qr_codes")
      .select("id, location_id")
      .eq("code", qr_code)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (qrError || !qrData) {
      console.warn(`QR not found in DB for user ${user.id}`);
      return new Response(
        JSON.stringify({ 
          error: "Código QR no encontrado o ya fue usado.",
          code: "QR_NOT_FOUND" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check existing records for today
    const today = new Date().toISOString().split("T")[0];
    const { data: todayRecords, error: recordsError } = await supabaseAdmin
      .from("attendance_records")
      .select("record_type, recorded_at")
      .eq("user_id", user.id)
      .gte("recorded_at", `${today}T00:00:00`)
      .order("recorded_at", { ascending: true });

    if (recordsError) {
      console.error("Records query error:", recordsError);
      return new Response(
        JSON.stringify({ 
          error: "Error al consultar registros.",
          code: "DB_ERROR" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count entries and exits
    const entryCount = todayRecords?.filter(r => r.record_type === "entrada").length || 0;
    const exitCount = todayRecords?.filter(r => r.record_type === "salida").length || 0;
    const lastRecord = todayRecords?.[todayRecords.length - 1];

    // Determine record type
    const recordType: "entrada" | "salida" = 
      !lastRecord || lastRecord.record_type === "salida" ? "entrada" : "salida";

    // Validate daily limits
    if (recordType === "entrada" && entryCount >= 1) {
      return new Response(
        JSON.stringify({ 
          error: "Ya registraste tu entrada hoy.",
          code: "ENTRY_LIMIT" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (recordType === "salida" && exitCount >= 1) {
      return new Response(
        JSON.stringify({ 
          error: "Ya registraste tu salida hoy.",
          code: "EXIT_LIMIT" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert attendance record
    const { error: insertError } = await supabaseAdmin
      .from("attendance_records")
      .insert({
        user_id: user.id,
        location_id: qrData.location_id,
        qr_code_id: qrData.id,
        record_type: recordType,
        recorded_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ 
          error: "Error al registrar asistencia.",
          code: "INSERT_ERROR" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully recorded ${recordType} for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        record_type: recordType,
        recorded_at: new Date().toISOString(),
        message: `${recordType === "entrada" ? "Entrada" : "Salida"} registrada correctamente.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error validating QR:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
