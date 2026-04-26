// Real auth backed by Supabase Auth + the existing `users` table.
// We match the authenticated user to a row in `public.users` by email,
// then read role and company_id from that row.

import { supabase } from "@/integrations/supabase/client";

export type Role = "super_admin" | "company_admin" | "project_manager" | "project_engineer";

export interface AppUser {
  id: string;            // public.users.id
  authId: string;        // auth.users.id
  email: string;
  name: string;
  role: Role;
  companyId: string | null;
  companyName: string | null;
}

export const roleHome = (role: Role): string => {
  switch (role) {
    case "super_admin": return "/admin";
    case "company_admin": return "/workspace";
    case "project_manager": return "/workspace/projects";
    case "project_engineer": return "/workspace/issues";
  }
};

export const roleLabel = (role: Role): string => ({
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  project_manager: "Project Manager",
  project_engineer: "Project Engineer",
}[role]);

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  if (!data.user) return { error: "No user returned" };
  return { error: null };
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

// Lookup the matching public.users row by email and join the company name.
export const loadAppUser = async (authId: string, email: string): Promise<AppUser | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, company_id, companies(name)")
    .eq("email", email)
    .maybeSingle();

  if (error || !data) return null;

  const role = data.role as Role;
  return {
    id: data.id,
    authId,
    email: data.email,
    name: data.full_name,
    role,
    companyId: data.company_id,
    companyName: (data.companies as { name: string } | null)?.name ?? null,
  };
};