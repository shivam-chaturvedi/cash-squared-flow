import { db, type AppNotificationRow } from "@/lib/db";

const EVENT_NAME = "cash-squared:notifications";

export function subscribeNotifications(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

export function emitNotificationsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export async function addNotification(input: Omit<AppNotificationRow, "id" | "created_at">) {
  const res = await db.notifications.add(input);
  if (!res.error) {
    emitNotificationsChanged();
  }
  return res;
}

