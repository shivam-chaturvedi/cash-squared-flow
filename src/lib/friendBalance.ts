import type { PersonalFriendEntryRow } from "@/lib/db";

/** Net balance for viewer: positive = they owe you, negative = you owe them. */
export function balanceForUser(entries: PersonalFriendEntryRow[], viewerUserId: string): number {
  let total = 0;
  for (const entry of entries) {
    const amt = Number(entry.amount);
    const createdBy = entry.created_by_user_id ?? entry.user_id;
    if (createdBy === viewerUserId) {
      total += entry.direction === "they_owe_me" ? amt : -amt;
    } else {
      total += entry.direction === "they_owe_me" ? -amt : amt;
    }
  }
  return total;
}
