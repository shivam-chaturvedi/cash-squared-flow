import { supabase } from "@/lib/supabaseClient";
import { normalizeAccessPages, type BusinessAccessPageId } from "@/lib/businessAccessPages";
import { normalizeEmployeeRole } from "@/lib/employeeRoles";

export type BusinessEmployeeMembership = {
  id: string;
  user_id: string;
  email: string;
  role: string | null;
  access_pages: string[] | null;
  employee_user_id: string | null;
};

/** Resolve the correct business_employees row for the signed-in user. */
export async function fetchBusinessEmployeeMembership(
  currentUserId: string,
  email: string,
  employeeOfUserId?: string | null,
): Promise<BusinessEmployeeMembership | null> {
  const { data: byLink } = await supabase
    .from("business_employees")
    .select("id,user_id,email,role,access_pages,employee_user_id")
    .eq("employee_user_id", currentUserId)
    .maybeSingle();

  if (byLink?.user_id) return byLink as BusinessEmployeeMembership;

  if (employeeOfUserId) {
    const { data: byOwnerEmail } = await supabase
      .from("business_employees")
      .select("id,user_id,email,role,access_pages,employee_user_id")
      .eq("user_id", employeeOfUserId)
      .ilike("email", email)
      .maybeSingle();
    if (byOwnerEmail?.user_id) return byOwnerEmail as BusinessEmployeeMembership;
  }

  const { data: byEmail } = await supabase
    .from("business_employees")
    .select("id,user_id,email,role,access_pages,employee_user_id")
    .ilike("email", email);

  if (byEmail?.length === 1) return byEmail[0] as BusinessEmployeeMembership;
  return null;
}

/** After employer edits access/role: sync profile, link user id, update pending invites. */
export async function syncEmployeeAccessToLinkedAccounts(
  employee: BusinessEmployeeMembership,
  accessPages: BusinessAccessPageId[],
  role?: string | null,
): Promise<{ error: string | null }> {
  const normalized = normalizeAccessPages(accessPages);
  const employeeRole = normalizeEmployeeRole(role ?? employee.role);

  let linkedUserId = employee.employee_user_id;
  if (!linkedUserId) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("email", employee.email)
      .maybeSingle();
    linkedUserId = profileRow?.user_id ?? null;
    if (linkedUserId) {
      await supabase
        .from("business_employees")
        .update({ employee_user_id: linkedUserId })
        .eq("id", employee.id);
    }
  }

  if (linkedUserId) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        employee_access_pages: normalized,
        employee_of_user_id: employee.user_id,
        account_types: ["business"],
        business_role: employeeRole,
        roles: [employeeRole],
        is_business: true,
      })
      .eq("user_id", linkedUserId);
    if (profileError) return { error: profileError.message };
  }

  await supabase
    .from("business_employee_invites")
    .update({ access_pages: normalized, role: employeeRole })
    .eq("owner_user_id", employee.user_id)
    .ilike("employee_email", employee.email)
    .eq("status", "pending");

  return { error: null };
}

const BROADCAST_KEY = "cash-squared-employee-access-changed";

export function broadcastEmployeeAccessChanged() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BROADCAST_KEY, String(Date.now()));
  window.dispatchEvent(new CustomEvent("cash-squared:employee-access-changed"));
}

export function subscribeEmployeeAccessChanged(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const onCustom = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === BROADCAST_KEY) cb();
  };
  window.addEventListener("cash-squared:employee-access-changed", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("cash-squared:employee-access-changed", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
