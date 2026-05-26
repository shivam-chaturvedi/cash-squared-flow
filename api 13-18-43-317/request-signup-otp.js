import { createClient } from "@supabase/supabase-js";

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
};

const setCors = (req, res) => {
  const allowedOrigin = process.env.CORS_ALLOW_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  // Prevent caching of CORS preflight responses across origins.
  if (req.method === "OPTIONS") res.setHeader("Vary", "Origin");
};

const readJsonBody = async (req) => {
  const body = req.body;
  if (body && typeof body === "object" && !Buffer.isBuffer(body)) return body;
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString("utf8"));
    } catch {
      return {};
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed" });

  try {
    const payload = await readJsonBody(req);
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const password = typeof payload.password === "string" ? payload.password : "";

    const fullName = typeof payload.full_name === "string" ? payload.full_name.trim() : "";
    const ageRaw = payload.age;
    const age =
      typeof ageRaw === "number"
        ? ageRaw
        : typeof ageRaw === "string" && ageRaw.trim() && !Number.isNaN(Number(ageRaw))
          ? Number(ageRaw)
          : null;

    if (!email || !password) {
      return sendJson(res, 400, { ok: false, error: "email and password are required" });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return sendJson(res, 500, {
        ok: false,
        error: "Server not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          ...(fullName ? { full_name: fullName } : {}),
          ...(typeof age === "number" ? { age } : {}),
        },
      },
    });

    if (error) {
      return sendJson(res, 400, { ok: false, error: error.message });
    }

    const otp = data?.properties?.email_otp;
    if (!otp) {
      return sendJson(res, 500, { ok: false, error: "Unable to generate OTP" });
    }

    const mailerUrl = (process.env.MAILER_URL || "https://avail-mailer.vercel.app/").trim();
    const mailRes = await fetch(mailerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Your Cash Squared Flow verification code",
        text: `Your verification code is: ${otp}\n\nIf you didn’t request this, you can ignore this email.`,
      }),
    });

    if (!mailRes.ok) {
      const text = await mailRes.text().catch(() => "");
      console.error("Mailer error:", mailRes.status, text);
      return sendJson(res, 502, { ok: false, error: "Unable to send OTP email right now" });
    }

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("request-signup-otp error:", err);
    return sendJson(res, 500, { ok: false, error: err instanceof Error ? err.message : "Server error" });
  }
}

