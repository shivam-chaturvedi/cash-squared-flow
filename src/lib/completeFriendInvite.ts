import { supabase } from "@/lib/supabaseClient";
import type { PendingFriendInvite } from "@/lib/pendingFriendInvite";

export async function completeFriendInvite(
  invite: PendingFriendInvite,
  claimedUserId: string,
  claimedEmail: string,
  claimedName: string,
): Promise<{ error: string | null }> {
  try {
    const { data: connection, error: connErr } = await supabase
      .from("personal_friend_connections")
      .select("*")
      .eq("id", invite.connectionId)
      .maybeSingle();
    if (connErr || !connection) return { error: connErr?.message ?? "Connection not found" };

    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name,email")
      .eq("user_id", invite.inviterUserId)
      .maybeSingle();
    const inviterName = inviterProfile?.full_name || inviterProfile?.email?.split("@")[0] || "Friend";
    const inviterEmail = (inviterProfile?.email ?? "").toLowerCase();

    const now = new Date().toISOString();

    await supabase
      .from("personal_friend_invites")
      .update({
        status: "accepted",
        accepted_at: now,
        claimed_user_id: claimedUserId,
      })
      .eq("id", invite.inviteId);

    await supabase
      .from("personal_friend_connections")
      .update({
        status: "active",
        invitee_user_id: claimedUserId,
        accepted_at: now,
      })
      .eq("id", invite.connectionId);

    await supabase
      .from("personal_friends")
      .update({
        friend_user_id: claimedUserId,
        status: "active",
      })
      .eq("connection_id", invite.connectionId)
      .eq("user_id", invite.inviterUserId);

    const { data: existingRow } = await supabase
      .from("personal_friends")
      .select("id")
      .eq("user_id", claimedUserId)
      .eq("connection_id", invite.connectionId)
      .maybeSingle();

    if (!existingRow) {
      await supabase.from("personal_friends").insert({
        user_id: claimedUserId,
        friend_name: inviterName,
        friend_email: inviterEmail,
        friend_user_id: invite.inviterUserId,
        connection_id: invite.connectionId,
        status: "active",
      });
    }

    await supabase.from("personal_friend_activity_log").insert({
      connection_id: invite.connectionId,
      actor_user_id: claimedUserId,
      action: "invite_accepted",
      summary: `${claimedName || claimedEmail} joined the shared IOU tracker`,
      details: { invite_id: invite.inviteId },
    });

    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unable to complete friend invite" };
  }
}
