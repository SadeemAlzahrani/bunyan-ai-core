import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const {
      companyName,
      industry,
      headquartersCity,
      subscriptionPlan,
      adminName,
      adminEmail,
      adminPassword,
    } = await req.json();

    if (!companyName || !adminEmail || !adminPassword) {
      return new Response(
        JSON.stringify({
          error: "Company name, admin email, and password are required.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          error: "Missing Supabase environment variables.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const cleanPlan = subscriptionPlan || "starter";

    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .insert({
        name: companyName,
        industry: industry || "Construction",
        headquarters_city: headquartersCity || null,
        subscription_plan: cleanPlan,
        is_active: true,
      })
      .select("id, name, industry, headquarters_city, subscription_plan, is_active, created_at")
      .single();

    if (companyError) {
      throw companyError;
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminName || "Company Admin",
          role: "company_admin",
          company_id: company.id,
        },
      });

    if (authError) {
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      throw authError;
    }

    const { error: userError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      email: adminEmail,
      full_name: adminName || "Company Admin",
      role: "company_admin",
      company_id: company.id,
      is_active: true,
    });

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      await supabaseAdmin.from("companies").delete().eq("id", company.id);
      throw userError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tenant and company admin created successfully.",
        company,
        admin: {
          id: authData.user.id,
          email: authData.user.email,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error?.message || "Unexpected error while provisioning tenant.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
})