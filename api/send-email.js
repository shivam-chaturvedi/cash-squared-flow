import nodemailer from "nodemailer";
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

let cachedTransporter = null;
const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;
  const user = getEnv("GMAIL_USER");
  const pass = getEnv("GMAIL_APP_PASSWORD");
  if (!user || !pass) {
    throw new Error("Missing GMAIL_USER / GMAIL_APP_PASSWORD env vars");
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return cachedTransporter;
};

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

const buildEmail = ({ type, code, title, message }) => {
  if (type === "otp") {
    return {
      subject: "Your Cash Squared Flow verification code",
      text: `Your verification code is: ${code}`,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
  <h2 style="margin:0 0 12px">Verification code</h2>
  <p style="margin:0 0 12px">Use this code to continue:</p>
  <div style="font-size:28px;font-weight:700;letter-spacing:4px;margin:12px 0">${code}</div>
  <p style="margin:0;color:#666;font-size:12px">If you didn’t request this, you can ignore this email.</p>
</div>`,
    };
  }

  if (type === "reminder") {
    const safeTitle = title?.trim() ? title.trim() : "Reminder";
    const safeMessage = message?.trim() ? message.trim() : "";
    return {
      subject: `Cash Squared Flow — ${safeTitle}`,
      text: safeMessage,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
  <h2 style="margin:0 0 12px">${safeTitle}</h2>
  <p style="margin:0 0 12px">${safeMessage.replaceAll("\n", "<br/>")}</p>
</div>`,
    };
  }

  throw new Error("Invalid email type");
};

export default async function handler(req, res) {
  const allowOrigin = getEnv("APP_ORIGIN") ?? "*";
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const authHeader = req.headers?.authorization ?? req.headers?.Authorization ?? "";
    const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return json(res, 401, { error: "Missing Authorization Bearer token" });

    const body = readJsonBody(req);
    const type = body?.type;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return json(res, 401, { error: "Invalid token" });

    const userEmail = data?.user?.email ?? null;
    if (!userEmail) return json(res, 400, { error: "No email on user" });

    const requestedTo = typeof body?.to === "string" ? body.to.trim() : "";
    const to = requestedTo || userEmail;
    const allowArbitraryTo = getEnv("MAILER_ALLOW_ARBITRARY_TO") === "true";
    if (!allowArbitraryTo && to.toLowerCase() !== userEmail.toLowerCase()) {
      return json(res, 403, { error: "Recipient must match authenticated user" });
    }

    if (type === "otp") {
      const code = typeof body?.code === "string" ? body.code.trim() : "";
      if (!code) return json(res, 400, { error: "Missing code" });
      const email = buildEmail({ type, code });
      const transporter = getTransporter();
      await transporter.sendMail({ from: getEnv("GMAIL_USER"), to, ...email });
      return json(res, 200, { ok: true });
    }

    if (type === "reminder") {
      const title = typeof body?.title === "string" ? body.title : "";
      const message = typeof body?.message === "string" ? body.message : "";
      if (!message.trim()) return json(res, 400, { error: "Missing message" });
      const email = buildEmail({ type, title, message });
      const transporter = getTransporter();
      await transporter.sendMail({ from: getEnv("GMAIL_USER"), to, ...email });
      return json(res, 200, { ok: true });
    }

    return json(res, 400, { error: "Invalid type (use 'otp' or 'reminder')" });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("send-email error:", err);
    return json(res, 500, { error: err?.message ?? "Internal error" });
  }
}

