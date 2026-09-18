import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "No autorizado" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "No autorizado" }, 401);
    }
    const callerId = claimsData.claims.sub as string;

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Datos inválidos" }, 400);

    const fullName = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const organizationId = String(body.organization_id ?? "");
    const phoneNumber = body.phone_number ? String(body.phone_number).trim() : null;
    const role = body.role === "admin" ? "admin" : "user";
    const locationId = body.location_id ? String(body.location_id) : null;
    const shiftId = body.shift_id ? String(body.shift_id) : null;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (fullName.length < 2 || fullName.length > 120) {
      return json({ error: "El nombre debe tener entre 2 y 120 caracteres" }, 400);
    }
    if (!emailOk) return json({ error: "Correo electrónico inválido" }, 400);
    if (password.length < 8 || password.length > 72) {
      return json({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);
    }
    if (!organizationId) return json({ error: "Seleccioná una organización" }, 400);

    // Caller must be owner of the organization or an accepted admin member
    const { data: org } = await admin
      .from("organizations")
      .select("id, name, owner_id")
      .eq("id", organizationId)
      .maybeSingle();

    if (!org) return json({ error: "Organización no encontrada" }, 404);

    let allowed = org.owner_id === callerId;
    if (!allowed) {
      const { data: membership } = await admin
        .from("organization_members")
        .select("id")
        .eq("organization_id", organizationId)
        .eq("user_id", callerId)
        .eq("status", "accepted")
        .maybeSingle();
      const { data: roleRow } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", callerId)
        .eq("role", "admin")
        .maybeSingle();
      allowed = Boolean(membership && roleRow);
    }
    if (!allowed) return json({ error: "No tenés permisos sobre esta organización" }, 403);

    // Email must not already be a member of this organization
    const { data: existingMember } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("invited_email", email)
      .maybeSingle();
    if (existingMember) {
      return json({ error: "Ese correo ya pertenece a esta organización" }, 409);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created?.user) {
      const msg = createError?.message ?? "";
      if (msg.toLowerCase().includes("already")) {
        return json({ error: "Ya existe una cuenta con ese correo" }, 409);
      }
      return json({ error: msg || "No se pudo crear la cuenta" }, 400);
    }

    const newUserId = created.user.id;

    const rollback = async (message: string) => {
      await admin.auth.admin.deleteUser(newUserId).catch(() => {});
      return json({ error: message }, 400);
    };

    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        { user_id: newUserId, full_name: fullName, email, phone_number: phoneNumber },
        { onConflict: "user_id" }
      );
    if (profileError) return await rollback("No se pudo guardar el perfil del empleado");

    await admin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: newUserId, role });
    if (roleError) return await rollback("No se pudo asignar el rol");

    const { error: memberError } = await admin.from("organization_members").insert({
      organization_id: organizationId,
      invited_email: email,
      invited_by: callerId,
      user_id: newUserId,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    });
    if (memberError) return await rollback("No se pudo agregar el empleado a la organización");

    if (locationId || shiftId) {
      const { error: assignError } = await admin.from("employee_assignments").upsert(
        {
          user_id: newUserId,
          organization_id: organizationId,
          location_id: locationId,
          shift_id: shiftId,
        },
        { onConflict: "user_id,organization_id" }
      );
      if (assignError) {
        console.error("assignment error", assignError);
      }
    }

    return json({
      success: true,
      user_id: newUserId,
      email,
      full_name: fullName,
      organization_name: org.name,
    });
  } catch (error) {
    console.error("create-employee error", error);
    return json({ error: "Error inesperado al crear el empleado" }, 500);
  }
});
