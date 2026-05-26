import { supabase } from "@/lib/supabaseClient";
import type { AppMode } from "@/contexts/AppContext";
import type { PendingInvite } from "@/lib/pendingInvite";
import { normalizeAccessPages } from "@/lib/businessAccessPages";
import { normalizeEmployeeRole } from "@/lib/employeeRoles";

/** Accept invite, link employee row, and return owner context for profile updates. */
export async function completeEmployeeInvite(
  invite: PendingInvite,
  claimedUserId: string,
): Promise<{ error: string | null }> {
  const accessPages = normalizeAccessPages(invite.accessPages);
  const role = normalizeEmployeeRole(invite.employeeRole);
  try {
    const { error: inviteError } = await supabase
      .from("business_employee_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        claimed_user_id: claimedUserId,
      })
      .eq("id", invite.inviteId);

    if (inviteError) return { error: inviteError.message };

    const { error: employeeError } = await supabase
      .from("business_employees")
      .upsert(
        {
          user_id: invite.ownerUserId,
          email: invite.employeeEmail,
          name: invite.employeeName,
          role,
          access_pages: accessPages,
          salary: invite.salary,
          employee_user_id: claimedUserId,
          last_edit_at: new Date().toISOString(),
        },
        { onConflict: "user_id,email" },
      );

    if (employeeError) return { error: employeeError.message };
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to complete invite" };
  }
}

export const employeeProfileFromInvite = (invite: PendingInvite) => {
  const role = normalizeEmployeeRole(invite.employeeRole);
  return {
    employee_of_user_id: invite.ownerUserId,
    employee_access_pages: normalizeAccessPages(invite.accessPages),
    account_types: ["business"] as AppMode[],
    is_business: true,
    business_role: role,
    roles: [role],
  };
};
