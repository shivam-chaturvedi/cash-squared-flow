import { supabase } from "@/lib/supabaseClient";

export type DbResult<T> = { data: T | null; error: string | null };

const ok = <T,>(data: T): DbResult<T> => ({ data, error: null });
const fail = <T,>(error: unknown): DbResult<T> => ({
  data: null,
  error: error instanceof Error ? error.message : "Unknown error",
});

const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const withNumbers = <T extends Record<string, unknown>>(row: T, keys: (keyof T)[]) => {
  const next = { ...row };
  for (const k of keys) {
    next[k] = toNumber(next[k]);
  }
  return next;
};

import { normalizeAccessPages } from "@/lib/businessAccessPages";
import { normalizeEmployeeRole } from "@/lib/employeeRoles";

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean);
    } catch {
      // fall through to comma separated parsing
    }
    return text.split(",").map((part) => part.trim()).filter(Boolean);
  }
  return [];
};

export type PersonalExpenseRow = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  description: string | null;
  spent_on: string;
  created_at: string;
  updated_at: string;
};

export type PersonalBudgetRow = {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
};

export type PersonalFriendRow = {
  id: string;
  user_id: string;
  friend_name: string;
  friend_email: string;
  friend_user_id: string | null;
  connection_id: string | null;
  status: "pending" | "active" | string;
  created_at: string;
  updated_at: string;
};

export type PersonalFriendEntryRow = {
  id: string;
  user_id: string;
  friend_id: string;
  connection_id: string | null;
  created_by_user_id: string | null;
  direction: "they_owe_me" | "i_owe_them";
  amount: number;
  note: string | null;
  entry_on: string;
  created_at: string;
  updated_at: string;
};

export type PersonalFriendInviteRow = {
  id: string;
  connection_id: string;
  inviter_user_id: string;
  invitee_name: string;
  invitee_email: string;
  status: string;
  claimed_user_id: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PersonalFriendActivityRow = {
  id: string;
  connection_id: string;
  actor_user_id: string | null;
  action: string;
  summary: string;
  details: Record<string, unknown>;
  created_at: string;
};

export type BusinessCustomerRow = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  balance: number;
  created_at: string;
  updated_at: string;
};

export type BusinessSupplierRow = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  balance: number;
  created_at: string;
  updated_at: string;
};

export type BusinessEmployeeRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string | null;
  access_pages: string[] | null;
  employee_user_id: string | null;
  salary: number | null;
  last_edit_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessTransactionRow = {
  id: string;
  user_id: string;
  type: "in" | "out";
  amount: number;
  description: string;
  occurred_at: string;
  customer_id: string | null;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BusinessExpenseRow = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  description: string | null;
  spent_on: string;
  created_at: string;
  updated_at: string;
};

export type AppNotificationRow = {
  id: string;
  user_id: string;
  scope: "personal" | "business";
  type: string;
  title: string;
  description: string | null;
  actor: string | null;
  actor_role: string | null;
  created_at: string;
};

export type BusinessEmployeeInviteRow = {
  id: string;
  owner_user_id: string;
  employee_name: string;
  employee_email: string;
  role: string | null;
  access_pages: string[];
  salary: number | string | null;
  status: "pending" | "accepted" | string;
  accepted_at: string | null;
  claimed_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export const db = {
  personal: {
    async listExpenses(userId: string): Promise<DbResult<PersonalExpenseRow[]>> {
      try {
        const { data, error } = await supabase
          .from("personal_expenses")
          .select("*")
          .eq("user_id", userId)
          .order("spent_on", { ascending: false })
          .order("created_at", { ascending: false });
        if (error) return { data: null, error: error.message };
        const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => withNumbers(r, ["amount"]) as unknown as PersonalExpenseRow);
        return ok(rows);
      } catch (e) {
        return fail(e);
      }
    },
    async addExpense(input: {
      user_id: string;
      category: string;
      amount: number;
      description?: string;
      spent_on: string;
    }): Promise<DbResult<PersonalExpenseRow>> {
      try {
        const { data, error } = await supabase
          .from("personal_expenses")
          .insert({
            user_id: input.user_id,
            category: input.category,
            amount: input.amount,
            description: input.description ?? null,
            spent_on: input.spent_on,
          })
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        return ok(withNumbers(data as unknown as Record<string, unknown>, ["amount"]) as unknown as PersonalExpenseRow);
      } catch (e) {
        return fail(e);
      }
    },
    async listBudgets(userId: string): Promise<DbResult<PersonalBudgetRow[]>> {
      try {
        const { data, error } = await supabase.from("personal_budgets").select("*").eq("user_id", userId).order("category");
        if (error) return { data: null, error: error.message };
        const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => withNumbers(r, ["monthly_limit"]) as unknown as PersonalBudgetRow);
        return ok(rows);
      } catch (e) {
        return fail(e);
      }
    },
    async upsertBudget(input: { user_id: string; category: string; monthly_limit: number }): Promise<DbResult<PersonalBudgetRow>> {
      try {
        const { data, error } = await supabase
          .from("personal_budgets")
          .upsert(input, { onConflict: "user_id,category" })
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        return ok(withNumbers(data as unknown as Record<string, unknown>, ["monthly_limit"]) as unknown as PersonalBudgetRow);
      } catch (e) {
        return fail(e);
      }
    },
    async findUserIdByEmail(email: string): Promise<DbResult<string | null>> {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("email", email.trim())
          .maybeSingle();
        if (error) return { data: null, error: error.message };
        return ok(data?.user_id ? String(data.user_id) : null);
      } catch (e) {
        return fail(e);
      }
    },
    async listFriends(userId: string): Promise<DbResult<PersonalFriendRow[]>> {
      try {
        const { data, error } = await supabase.from("personal_friends").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        if (error) return { data: null, error: error.message };
        return ok((data ?? []) as PersonalFriendRow[]);
      } catch (e) {
        return fail(e);
      }
    },
    async getFriendInvite(inviteId: string): Promise<DbResult<PersonalFriendInviteRow>> {
      try {
        const { data, error } = await supabase
          .from("personal_friend_invites")
          .select("*")
          .eq("id", inviteId)
          .maybeSingle();
        if (error) return { data: null, error: error.message };
        if (!data) return { data: null, error: "Invite not found" };
        return ok(data as PersonalFriendInviteRow);
      } catch (e) {
        return fail(e);
      }
    },
    async inviteFriend(input: {
      inviter_user_id: string;
      friend_name: string;
      friend_email: string;
    }): Promise<DbResult<{ friend: PersonalFriendRow; invite: PersonalFriendInviteRow | null; existingUserId: string | null }>> {
      try {
        const email = input.friend_email.trim().toLowerCase();
        const name = input.friend_name.trim();
        const existing = await db.personal.findUserIdByEmail(email);
        if (existing.error) return { data: null, error: existing.error };
        const existingUserId = existing.data;

        const { data: connection, error: connErr } = await supabase
          .from("personal_friend_connections")
          .insert({
            inviter_user_id: input.inviter_user_id,
            invitee_email: email,
            invitee_name: name,
            invitee_user_id: existingUserId,
            status: existingUserId ? "active" : "pending",
            accepted_at: existingUserId ? new Date().toISOString() : null,
          })
          .select("*")
          .single();
        if (connErr || !connection) return { data: null, error: connErr?.message ?? "Unable to create connection" };

        const { data: friendRow, error: friendErr } = await supabase
          .from("personal_friends")
          .insert({
            user_id: input.inviter_user_id,
            friend_name: name,
            friend_email: email,
            friend_user_id: existingUserId,
            connection_id: connection.id,
            status: existingUserId ? "active" : "pending",
          })
          .select("*")
          .single();
        if (friendErr || !friendRow) return { data: null, error: friendErr?.message ?? "Unable to add friend" };

        let inviteRow: PersonalFriendInviteRow | null = null;
        if (!existingUserId) {
          const { data: invite, error: inviteErr } = await supabase
            .from("personal_friend_invites")
            .insert({
              connection_id: connection.id,
              inviter_user_id: input.inviter_user_id,
              invitee_name: name,
              invitee_email: email,
            })
            .select("*")
            .single();
          if (inviteErr) return { data: null, error: inviteErr.message };
          inviteRow = invite as PersonalFriendInviteRow;
        } else {
          const { data: inviterProfile } = await supabase
            .from("profiles")
            .select("full_name,email")
            .eq("user_id", input.inviter_user_id)
            .maybeSingle();
          const { data: reciprocal } = await supabase
            .from("personal_friends")
            .select("id")
            .eq("user_id", existingUserId)
            .eq("connection_id", connection.id)
            .maybeSingle();
          if (!reciprocal) {
            await supabase.from("personal_friends").insert({
              user_id: existingUserId,
              friend_name: inviterProfile?.full_name || inviterProfile?.email?.split("@")[0] || "Friend",
              friend_email: (inviterProfile?.email ?? "").toLowerCase(),
              friend_user_id: input.inviter_user_id,
              connection_id: connection.id,
              status: "active",
            });
          }
        }

        await supabase.from("personal_friend_activity_log").insert({
          connection_id: connection.id,
          actor_user_id: input.inviter_user_id,
          action: existingUserId ? "friend_linked" : "invite_sent",
          summary: existingUserId
            ? `${name} was added — you can track IOUs together now`
            : `Invite sent to ${name} (${email})`,
          details: { invitee_email: email },
        });

        return ok({
          friend: friendRow as PersonalFriendRow,
          invite: inviteRow,
          existingUserId,
        });
      } catch (e) {
        return fail(e);
      }
    },
    async listFriendEntries(userId: string): Promise<DbResult<PersonalFriendEntryRow[]>> {
      try {
        const friendsRes = await db.personal.listFriends(userId);
        if (friendsRes.error || !friendsRes.data) return { data: null, error: friendsRes.error ?? "Unable to load friends" };
        const connectionIds = friendsRes.data.map((f) => f.connection_id).filter(Boolean) as string[];
        if (connectionIds.length === 0) {
          const { data, error } = await supabase
            .from("personal_friend_entries")
            .select("*")
            .eq("user_id", userId)
            .order("entry_on", { ascending: false })
            .order("created_at", { ascending: false });
          if (error) return { data: null, error: error.message };
          return ok((data ?? []).map((r) => withNumbers(r as Record<string, unknown>, ["amount"])) as PersonalFriendEntryRow[]);
        }
        const { data, error } = await supabase
          .from("personal_friend_entries")
          .select("*")
          .in("connection_id", connectionIds)
          .order("entry_on", { ascending: false })
          .order("created_at", { ascending: false });
        if (error) return { data: null, error: error.message };
        return ok(
          ((data ?? []) as Record<string, unknown>[]).map(
            (r) => withNumbers(r, ["amount"]) as unknown as PersonalFriendEntryRow,
          ),
        );
      } catch (e) {
        return fail(e);
      }
    },
    async listFriendActivity(connectionId: string): Promise<DbResult<PersonalFriendActivityRow[]>> {
      try {
        const { data, error } = await supabase
          .from("personal_friend_activity_log")
          .select("*")
          .eq("connection_id", connectionId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) return { data: null, error: error.message };
        return ok((data ?? []) as PersonalFriendActivityRow[]);
      } catch (e) {
        return fail(e);
      }
    },
    async addFriendEntry(input: {
      user_id: string;
      friend_id: string;
      connection_id?: string | null;
      direction: "they_owe_me" | "i_owe_them";
      amount: number;
      note?: string;
      entry_on: string;
    }): Promise<DbResult<PersonalFriendEntryRow>> {
      try {
        const { data, error } = await supabase
          .from("personal_friend_entries")
          .insert({
            user_id: input.user_id,
            friend_id: input.friend_id,
            connection_id: input.connection_id ?? null,
            created_by_user_id: input.user_id,
            direction: input.direction,
            amount: input.amount,
            note: input.note ?? null,
            entry_on: input.entry_on,
          })
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        const row = withNumbers(data as unknown as Record<string, unknown>, ["amount"]) as unknown as PersonalFriendEntryRow;
        if (input.connection_id) {
          await supabase.from("personal_friend_activity_log").insert({
            connection_id: input.connection_id,
            actor_user_id: input.user_id,
            action: "entry_added",
            summary: `Entry added: ${input.direction === "they_owe_me" ? "they owe" : "you owe"} ${input.amount}`,
            details: {
              amount: input.amount,
              direction: input.direction,
              note: input.note ?? null,
              entry_on: input.entry_on,
            },
          });
        }
        return ok(row);
      } catch (e) {
        return fail(e);
      }
    },
  },
  business: {
    async listCustomers(userId: string): Promise<DbResult<BusinessCustomerRow[]>> {
      try {
        const { data, error } = await supabase.from("business_customers").select("*").eq("user_id", userId).order("name");
        if (error) return { data: null, error: error.message };
        const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => withNumbers(r, ["balance"]) as unknown as BusinessCustomerRow);
        return ok(rows);
      } catch (e) {
        return fail(e);
      }
    },
    async addCustomer(input: { user_id: string; name: string; phone?: string; email?: string; balance: number }): Promise<DbResult<BusinessCustomerRow>> {
      try {
        const { data, error } = await supabase
          .from("business_customers")
          .insert({
            user_id: input.user_id,
            name: input.name,
            phone: input.phone ?? null,
            email: input.email ?? null,
            balance: input.balance,
          })
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        return ok(withNumbers(data as unknown as Record<string, unknown>, ["balance"]) as unknown as BusinessCustomerRow);
      } catch (e) {
        return fail(e);
      }
    },
    async updateCustomerBalance(customerId: string, balance: number): Promise<DbResult<BusinessCustomerRow>> {
      try {
        const { data, error } = await supabase.from("business_customers").update({ balance }).eq("id", customerId).select("*").single();
        if (error) return { data: null, error: error.message };
        return ok(withNumbers(data as unknown as Record<string, unknown>, ["balance"]) as unknown as BusinessCustomerRow);
      } catch (e) {
        return fail(e);
      }
    },
    async listSuppliers(userId: string): Promise<DbResult<BusinessSupplierRow[]>> {
      try {
        const { data, error } = await supabase.from("business_suppliers").select("*").eq("user_id", userId).order("name");
        if (error) return { data: null, error: error.message };
        const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => withNumbers(r, ["balance"]) as unknown as BusinessSupplierRow);
        return ok(rows);
      } catch (e) {
        return fail(e);
      }
    },
    async addSupplier(input: { user_id: string; name: string; phone?: string; email?: string; balance: number }): Promise<DbResult<BusinessSupplierRow>> {
      try {
        const { data, error } = await supabase
          .from("business_suppliers")
          .insert({
            user_id: input.user_id,
            name: input.name,
            phone: input.phone ?? null,
            email: input.email ?? null,
            balance: input.balance,
          })
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        return ok(withNumbers(data as unknown as Record<string, unknown>, ["balance"]) as unknown as BusinessSupplierRow);
      } catch (e) {
        return fail(e);
      }
    },
    async updateSupplierBalance(supplierId: string, balance: number): Promise<DbResult<BusinessSupplierRow>> {
      try {
        const { data, error } = await supabase.from("business_suppliers").update({ balance }).eq("id", supplierId).select("*").single();
        if (error) return { data: null, error: error.message };
        return ok(withNumbers(data as unknown as Record<string, unknown>, ["balance"]) as unknown as BusinessSupplierRow);
      } catch (e) {
        return fail(e);
      }
    },
    async listEmployees(userId: string): Promise<DbResult<BusinessEmployeeRow[]>> {
      try {
        const { data, error } = await supabase.from("business_employees").select("*").eq("user_id", userId).order("created_at", { ascending: false });
        if (error) return { data: null, error: error.message };
        const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => {
          const normalized = {
            ...row,
            role: typeof row.role === "string" && row.role.trim() ? row.role : "Employee",
            access_pages: normalizeAccessPages(toStringArray(row.access_pages)),
            salary: row.salary === null ? null : toNumber(row.salary),
          };
          return normalized as unknown as BusinessEmployeeRow;
        });
        return ok(rows);
      } catch (e) {
        return fail(e);
      }
    },
    async updateEmployee(
      employeeId: string,
      input: { access_pages?: string[]; role?: string },
    ): Promise<DbResult<BusinessEmployeeRow>> {
      try {
        const payload: Record<string, unknown> = {
          last_edit_at: new Date().toISOString(),
        };
        if (input.access_pages) payload.access_pages = normalizeAccessPages(input.access_pages);
        if (typeof input.role === "string") payload.role = normalizeEmployeeRole(input.role);

        const { data, error } = await supabase
          .from("business_employees")
          .update(payload)
          .eq("id", employeeId)
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        const row = data as Record<string, unknown>;
        return ok({
          ...(row as object),
          role: normalizeEmployeeRole(row.role as string | null),
          access_pages: normalizeAccessPages(toStringArray(row.access_pages)),
        } as BusinessEmployeeRow);
      } catch (e) {
        return fail(e);
      }
    },
    async addEmployee(input: {
      user_id: string;
      name: string;
      email: string;
      access_pages: string[];
      role?: string;
      salary?: number;
    }): Promise<DbResult<BusinessEmployeeRow>> {
      try {
        const { data, error } = await supabase
          .from("business_employees")
          .insert({
            user_id: input.user_id,
            name: input.name,
            email: input.email,
            role: normalizeEmployeeRole(input.role),
            access_pages: normalizeAccessPages(input.access_pages),
            salary: typeof input.salary === "number" ? input.salary : null,
            last_edit_at: new Date().toISOString(),
          })
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        const row = data as Record<string, unknown>;
        return ok({
          ...withNumbers(row, ["salary"]),
          role: normalizeEmployeeRole(row.role as string | null),
          access_pages: normalizeAccessPages(toStringArray(row.access_pages)),
        } as BusinessEmployeeRow);
      } catch (e) {
        return fail(e);
      }
    },
    async listTransactions(userId: string): Promise<DbResult<BusinessTransactionRow[]>> {
      try {
        const { data, error } = await supabase
          .from("business_transactions")
          .select("*")
          .eq("user_id", userId)
          .order("occurred_at", { ascending: false });
        if (error) return { data: null, error: error.message };
        const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => withNumbers(r, ["amount"]) as unknown as BusinessTransactionRow);
        return ok(rows);
      } catch (e) {
        return fail(e);
      }
    },
    async addTransaction(input: {
      user_id: string;
      type: "in" | "out";
      amount: number;
      description: string;
      occurred_at: string;
      customer_id?: string | null;
      supplier_id?: string | null;
    }): Promise<DbResult<BusinessTransactionRow>> {
      try {
        const { data, error } = await supabase
          .from("business_transactions")
          .insert({
            user_id: input.user_id,
            type: input.type,
            amount: input.amount,
            description: input.description,
            occurred_at: input.occurred_at,
            customer_id: input.customer_id ?? null,
            supplier_id: input.supplier_id ?? null,
          })
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        return ok(withNumbers(data as unknown as Record<string, unknown>, ["amount"]) as unknown as BusinessTransactionRow);
      } catch (e) {
        return fail(e);
      }
    },
    async listExpenses(userId: string): Promise<DbResult<BusinessExpenseRow[]>> {
      try {
        const { data, error } = await supabase
          .from("business_expenses")
          .select("*")
          .eq("user_id", userId)
          .order("spent_on", { ascending: false })
          .order("created_at", { ascending: false });
        if (error) return { data: null, error: error.message };
        const rows = ((data ?? []) as Record<string, unknown>[]).map((r) => withNumbers(r, ["amount"]) as unknown as BusinessExpenseRow);
        return ok(rows);
      } catch (e) {
        return fail(e);
      }
    },
    async addExpense(input: { user_id: string; category: string; amount: number; description?: string; spent_on: string }): Promise<DbResult<BusinessExpenseRow>> {
      try {
        const { data, error } = await supabase
          .from("business_expenses")
          .insert({
            user_id: input.user_id,
            category: input.category,
            amount: input.amount,
            description: input.description ?? null,
            spent_on: input.spent_on,
          })
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        return ok(withNumbers(data as unknown as Record<string, unknown>, ["amount"]) as unknown as BusinessExpenseRow);
      } catch (e) {
        return fail(e);
      }
    },
    async createEmployeeInvite(input: {
      owner_user_id: string;
      employee_name: string;
      employee_email: string;
      access_pages: string[];
      role?: string;
      salary?: number;
    }): Promise<DbResult<BusinessEmployeeInviteRow>> {
      try {
        const { data, error } = await supabase
          .from("business_employee_invites")
          .insert({
            owner_user_id: input.owner_user_id,
            employee_name: input.employee_name,
            employee_email: input.employee_email,
            role: normalizeEmployeeRole(input.role),
            access_pages: normalizeAccessPages(input.access_pages),
            salary: typeof input.salary === "number" ? input.salary : null,
          })
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        return ok(data as BusinessEmployeeInviteRow);
      } catch (e) {
        return fail(e);
      }
    },
    async getEmployeeInvite(inviteId: string): Promise<DbResult<BusinessEmployeeInviteRow>> {
      try {
        const { data, error } = await supabase
          .from("business_employee_invites")
          .select("*")
          .eq("id", inviteId)
          .maybeSingle();
        if (error) return { data: null, error: error.message };
        if (!data) return { data: null, error: "Invite not found" };
        return ok(data as BusinessEmployeeInviteRow);
      } catch (e) {
        return fail(e);
      }
    },
    async acceptEmployeeInvite(inviteId: string, claimedUserId: string): Promise<DbResult<BusinessEmployeeInviteRow>> {
      try {
        const { data, error } = await supabase
          .from("business_employee_invites")
          .update({
            status: "accepted",
            accepted_at: new Date().toISOString(),
            claimed_user_id: claimedUserId,
          })
          .eq("id", inviteId)
          .select("*")
          .single();
        if (error) return { data: null, error: error.message };
        return ok(data as BusinessEmployeeInviteRow);
      } catch (e) {
        return fail(e);
      }
    },
  },
  notifications: {
    async list(userId: string): Promise<DbResult<AppNotificationRow[]>> {
      try {
        const { data, error } = await supabase
          .from("app_notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) return { data: null, error: error.message };
        return ok((data ?? []) as AppNotificationRow[]);
      } catch (e) {
        return fail(e);
      }
    },
    async add(input: Omit<AppNotificationRow, "id" | "created_at">): Promise<DbResult<AppNotificationRow>> {
      try {
        const { data, error } = await supabase.from("app_notifications").insert(input).select("*").single();
        if (error) return { data: null, error: error.message };
        return ok(data as AppNotificationRow);
      } catch (e) {
        return fail(e);
      }
    },
  },
};
