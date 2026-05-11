// Real auth backed by Supabase Auth + the existing `users` table.
// We match the authenticated user to a row in `public.users` by email,
// then read role, company_id, and must_change_password from that row.

import { supabase } from "@/integrations/supabase/client";

export type Role =
  | "super_admin"
  | "company_admin"
  | "project_manager"
  | "project_engineer";

export interface AppUser {
  id: string;
  authId: string;
  email: string;
  name: string;
  role: Role;
  companyId: string | null;
  companyName: string | null;
  mustChangePassword: boolean;
}

export const roleHome = (role: Role): string => {
  switch (role) {
    case "super_admin":
      return "/admin";
    case "company_admin":
      return "/workspace";
    case "project_manager":
      return "/workspace/projects";
    case "project_engineer":
      return "/workspace/issues";
  }
};

export const roleLabel = (role: Role): string =>
  ({
    super_admin: "Super Admin",
    company_admin: "Company Admin",
    project_manager: "Project Manager",
    project_engineer: "Project Engineer",
  })[role];

export const signIn = async (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error) return { user: null, error: error.message };
  if (!data.user?.email) return { user: null, error: "No user returned" };

  const appUser = await loadAppUser(data.user.id, data.user.email);

  if (!appUser) return { user: null, error: "User profile not found" };

  return { user: appUser, error: null };
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const loadAppUser = async (
  authId: string,
  email: string
): Promise<AppUser | null> => {
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .single();

  console.log("USER LOOKUP:", data, error);

  if (error || !data) return null;

  let companyName: string | null = null;

  if (data.company_id) {
    const { data: company } = await supabase
      .from("companies")
      .select("company_name")
      .eq("id", data.company_id)
      .single();

    companyName = (company as any)?.company_name ?? null;
  }

  return {
    id: data.id,
    authId,
    email: data.email,
    name: data.full_name,
    role: data.role as Role,
    companyId: data.company_id,
    companyName,
    mustChangePassword: Boolean(data.must_change_password),
  };
};