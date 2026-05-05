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
  if (!user || !pass) throw new Error("Missing GMAIL_USER / GMAIL_APP_PASSWORD env vars");
  cachedTransporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  return cachedTransporter;
};

const getSupabaseAdmin = () => {
  const supabaseUrl = getEnv("SUPABASE_URL") ?? getEnv("VITE_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars");
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.end();
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const authHeader = req.headers?.authorization ?? req.headers?.Authorization ?? "";
    const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return json(res, 401, { error: "Missing Authorization Bearer token" });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return json(res, 401, { error: "Invalid token" });

    const userEmail = data?.user?.email ?? null;
    if (!userEmail) return json(res, 400, { error: "No email on user" });

    const body = readJsonBody(req);
    const to = typeof body?.to === "string" ? body.to.trim() : userEmail;
    const subject = typeof body?.subject === "string" ? body.subject : "";
    const text = typeof body?.text === "string" ? body.text : "";
    const html = typeof body?.html === "string" ? body.html : "";

    const allowArbitraryTo = getEnv("MAILER_ALLOW_ARBITRARY_TO") === "true";
    if (!allowArbitraryTo && to.toLowerCase() !== userEmail.toLowerCase()) {
      return json(res, 403, { error: "Recipient must match authenticated user" });
    }

    if (!to || !subject || (!text && !html)) {
      return json(res, 400, { error: "to, subject, and text/html are required" });
    }

    const transporter = getTransporter();
    await transporter.sendMail({ from: getEnv("GMAIL_USER"), to, subject, text, html });
    return json(res, 200, { ok: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("send-email error:", err);
    return json(res, 500, { error: err?.message ?? "Internal error" });
  }
}

