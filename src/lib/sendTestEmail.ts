type SendEmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: SendEmailPayload) {
  const mailerUrl =
    ((import.meta.env.VITE_API_BASE_URL as string | undefined) || "https://avail-mailer.vercel.app").trim();
  const res = await fetch(mailerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      subject,
      text,
      html,
    } satisfies SendEmailPayload),
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json().catch(() => null) : null;
  const responseText = data ? "" : await res.text().catch(() => "");

  if (!res.ok || (data && data.ok === false)) {
    throw new Error((data && (data.error || data.message)) || responseText || `Mailer request failed (${res.status})`);
  }

  return data ?? { ok: true };
}

export async function sendTestEmail() {
  return sendEmail({
    to: "test@gmail.com",
    subject: "Test Email",
    text: "Hello, this is a test email",
  });
}
