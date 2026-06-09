export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendMail(input: SendMailInput): Promise<{ ok: boolean; error: string | null }> {
  const base =
    (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
    "https://avail-mailer.vercel.app";
  try {
    const res = await fetch(base, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html ?? input.text,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: (body as { error?: string }).error ?? `Mailer error (${res.status})` };
    }
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unable to send email" };
  }
}

export function appWebsiteOrigin() {
  return (
    (import.meta.env.VITE_WEBSITE_LINK as string | undefined) ||
    (import.meta.env.WEBSITE_LINK as string | undefined) ||
    (typeof window !== "undefined" ? window.location.origin : "https://avail-money.vercel.app")
  ).replace(/\/$/, "");
}
