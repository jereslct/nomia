import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Error de configuración del servidor", code: "CONFIG_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const qrSigningSecret = Deno.env.get("QR_SIGNING_SECRET") || supabaseServiceKey.slice(0, 32);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Falta encabezado de autorización", code: "AUTH_MISSING" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: "No autorizado", code: "AUTH_FAILED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Demasiadas solicitudes. Esperá un momento.", code: "RATE_LIMITED" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { qr_code, force_reentry } = await req.json();
    if (!qr_code) {
      return new Response(
        JSON.stringify({ error: "Se requiere el código QR", code: "QR_MISSING" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Validating QR scan for user ${user.id}, force_reentry: ${force_reentry}`);

    // Validate QR format: nomia:nonce|location_id|expires_at|signature
    if (!qr_code.startsWith("nomia:")) {
      return new Response(
        JSON.stringify({ error: "Código QR inválido. Formato no reconocido.", code: "INVALID_FORMAT" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parts = qr_code.slice(6).split("|");
    if (parts.length !== 4) {
      return new Response(
        JSON.stringify({ error: "Código QR inválido. Estructura incorrecta.", code: "INVALID_STRUCTURE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const [nonce, locationId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);
    const payload = `${nonce}|${locationId}|${expiresAtStr}`;

    const isValidSignature = await verifySignature(payload, signature, qrSigningSecret);
    if (!isValidSignature) {
      console.warn(`Invalid signature for QR scan by user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Código QR manipulado o inválido.", code: "INVALID_SIGNATURE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = Date.now();
    if (now > expiresAt) {
      const expiredAgo = Math.floor((now - expiresAt) / 1000);
      console.warn(`Expired QR used by user ${user.id}, expired ${expiredAgo}s ago`);
      return new Response(
        JSON.stringify({ error: `Código QR expirado hace ${expiredAgo} segundos. Solicita uno nuevo.`, code: "QR_EXPIRED" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify QR exists in database
    const { data: qrData, error: qrError } = await supabaseAdmin
      .from("qr_codes")
      .select("id, location_id")
      .eq("code", qr_code)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (qrError || !qrData) {
      console.warn(`QR not found in DB for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Código QR no encontrado o ya fue usado.", code: "QR_NOT_FOUND" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user belongs to the organization of this location
    const { data: locationData } = await supabaseAdmin
      .from("locations")
      .select("organization_id")
      .eq("id", qrData.location_id)
      .maybeSingle();

    if (locationData?.organization_id) {
      const { data: membership } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("organization_id", locationData.organization_id)
        .eq("user_id", user.id)
        .eq("status", "accepted")
        .maybeSingle();

      // Also check if user is the org owner
      const { data: orgOwner } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("id", locationData.organization_id)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (!membership && !orgOwner) {
        console.warn(`User ${user.id} not in org for location ${qrData.location_id}`);
        return new Response(
          JSON.stringify({ error: "No pertenecés a esta organización.", code: "USER_NOT_IN_ORG" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
        JSON.stringify({ error: "Error al consultar registros.", code: "DB_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const entryCount = todayRecords?.filter(r => r.record_type === "entrada").length || 0;
    const exitCount = todayRecords?.filter(r => r.record_type === "salida").length || 0;
    const lastRecord = todayRecords?.[todayRecords.length - 1];

    // Determine record type
    const recordType: "entrada" | "salida" = 
      !lastRecord || lastRecord.record_type === "salida" ? "entrada" : "salida";

    // If user already has a complete cycle (entry+exit) and wants to enter again,
    // require confirmation (force_reentry flag)
    if (recordType === "entrada" && entryCount >= 1 && exitCount >= 1 && !force_reentry) {
      return new Response(
        JSON.stringify({ 
          error: "Ya completaste un ciclo de entrada/salida hoy.",
          code: "REENTRY_CONFIRMATION_NEEDED",
          entry_count: entryCount,
          exit_count: exitCount,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        JSON.stringify({ error: "Error al registrar asistencia.", code: "INSERT_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newEntryCount = recordType === "entrada" ? entryCount + 1 : entryCount;
    const newExitCount = recordType === "salida" ? exitCount + 1 : exitCount;

    console.log(`Successfully recorded ${recordType} for user ${user.id} (entry #${newEntryCount}, exit #${newExitCount})`);

    return new Response(
      JSON.stringify({
        success: true,
        record_type: recordType,
        recorded_at: new Date().toISOString(),
        entry_count: newEntryCount,
        exit_count: newExitCount,
        message: `${recordType === "entrada" ? "Entrada" : "Salida"} registrada correctamente.${newEntryCount > 1 ? ` (Ingreso #${newEntryCount})` : ""}`,
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
