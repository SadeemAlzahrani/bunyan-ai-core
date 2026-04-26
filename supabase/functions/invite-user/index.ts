// Edge function: invite a new user (admin-only).
// - Verifies the caller is super_admin or company_admin via JWT + public.users lookup.
// - Creates the auth user with the service role.
// - Inserts/updates a matching row in public.users with role + company_id.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InvitePayload {
  email: string;
  full_name: string;
  password: string;
  role: "company_admin" | "project_manager" | "project_engineer" | "super_admin";
  company_id?: string | null;
  job_title?: string | null;
  phone?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Caller client (anon + JWT) to identify who is calling.
    const callerClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerAuth, error: callerErr } = await callerClient.auth.getUser();
    if (callerErr || !callerAuth.user?.email) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Admin client (service role) for everything else.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Look up caller's role + company in public.users.
    const { data: callerRow, error: callerLookupErr } = await admin
      .from("users")
      .select("role, company_id")
      .eq("email", callerAuth.user.email)
      .maybeSingle();
    if (callerLookupErr || !callerRow) {
      return json({ error: "Caller not provisioned" }, 403);
    }
    if (callerRow.role !== "super_admin" && callerRow.role !== "company_admin") {
      return json({ error: "Forbidden" }, 403);
    }

    const body: InvitePayload = await req.json();
    if (!body?.email || !body?.full_name || !body?.password || !body?.role) {
      return json({ error: "Missing required fields" }, 400);
    }
    if (body.password.length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }

    // Determine target company. Company admins can only add to their own.
    let targetCompany = body.company_id ?? null;
    if (callerRow.role === "company_admin") {
      targetCompany = callerRow.company_id;
    }

    // Create auth user (auto-confirm so they can sign in immediately).
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name },
    });
    if (createErr) {
      return json({ error: createErr.message }, 400);
    }

    // Upsert matching public.users row by email.
    const { error: upsertErr } = await admin
      .from("users")
      .upsert(
        {
          email: body.email,
          full_name: body.full_name,
          role: body.role,
          company_id: targetCompany,
          job_title: body.job_title ?? null,
          phone: body.phone ?? null,
          is_active: true,
        },
        { onConflict: "email" }
      );

    if (upsertErr) {
      // Roll back auth user if profile insert failed.
      if (created.user?.id) {
        await admin.auth.admin.deleteUser(created.user.id);
      }
      return json({ error: upsertErr.message }, 400);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }

  function json(obj: unknown, status = 200) {
    return new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
