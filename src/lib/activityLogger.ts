import { supabase } from "@/integrations/supabase/client";

type ActivityInput = {
  companyId: string;
  userId?: string | null;
  action:
    | "created"
    | "uploaded"
    | "submitted"
    | "assigned"
    | "approved"
    | "rejected"
    | "resolved"
    | "generated"
    | "updated";
  entityType: "project" | "issue" | "report" | "contract" | "feedback";
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
};

export const logActivity = async ({
  companyId,
  userId = null,
  action,
  entityType,
  entityId = null,
  description,
  metadata = {},
}: ActivityInput) => {
  const { error } = await (supabase as any).from("activity_logs") .insert({
    tenant_id: companyId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    description,
    metadata,
  });

  if (error) {
    console.error("Activity log full error:", error);
   }
};