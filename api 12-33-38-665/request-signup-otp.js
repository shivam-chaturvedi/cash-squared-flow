import { createClient } from "@supabase/supabase-js";

const getEnv = (key) => {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  return {};
};

const isValidEmail = (email) => {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

const buildOtpEmail = (otp) => ({
  subject: "Your Cash Squared Flow verification code",
  text: `Your verification code is: ${otp}`,
  html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
  <h2 style="margin:0 0 12px">Verification code</h2>
  <p style="margin:0 0 12px">Use this code to continue:</p>
  <div style="font-size:28px;font-weight:700;letter-spacing:4px;margin:12px 0">${otp}</div>
  <p style="margin:0;color:#666;font-size:12px">If you didn’t request this, you can ignore this email.</p>
</div>`,
});

const getSupabaseAdmin = () => {
  const supabaseUrl = getEnv("SUPABASE_URL") ?? getEnv("VITE_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const body = readJsonBody(req);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const fullName = typeof body?.full_name === "string" ? body.full_name.trim() : "";
    const age = typeof body?.age === "number" ? body.age : Number(body?.age);

    if (!isValidEmail(email)) return json(res, 400, { error: "Invalid email" });
    if (!password || password.length < 6) return json(res, 400, { error: "Password must be at least 6 characters" });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          ...(fullName ? { full_name: fullName } : {}),
          ...(Number.isFinite(age) ? { age } : {}),
        },
      },
    });

    if (error) return json(res, 400, { error: error.message ?? "Unable to create signup OTP" });

    const otp = data?.properties?.email_otp;
    if (!otp) return json(res, 500, { error: "Missing OTP from Supabase" });

    const mailerUrl = (getEnv("MAILER_URL") ?? "https://avail-mailer.vercel.app").replace(/\/+$/, "");
    const emailPayload = buildOtpEmail(otp);

    const mailRes = await fetch(`${mailerUrl}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, ...emailPayload }),
    });

    if (!mailRes.ok) {
      const text = await mailRes.text().catch(() => "");
      return json(res, 502, { error: "Mailer failed", details: text.slice(0, 500) });
    }

    return json(res, 200, { ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("request-signup-otp error:", err);
    return json(res, 500, { error: err?.message ?? "Internal error" });
  }
}

