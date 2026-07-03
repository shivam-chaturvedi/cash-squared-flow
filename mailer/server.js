import nodemailer from "nodemailer";
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

function parseBoolean(value, fallback) {
  if (value == null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function buildTransportConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER?.trim() || process.env.GMAIL_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();
  const from = process.env.MAIL_FROM?.trim() || user;

  if (!user || !pass) {
    throw new Error("Missing SMTP credentials. Set SMTP_USER/SMTP_PASS or GMAIL_USER/GMAIL_APP_PASSWORD.");
  }

  if (host) {
    return {
      from,
      transport: {
        host,
        port: port || 465,
        secure: parseBoolean(process.env.SMTP_SECURE, (port || 465) === 465),
        auth: {
          user,
          pass,
        },
      },
    };
  }

  return {
    from,
    transport: {
      service: "gmail",
      auth: {
        user,
        pass,
      },
    },
  };
}

export default async function handler(req, res) {

  res.setHeader("Access-Control-Allow-Origin", "*"); // allow all origins
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const parseBody = () => {
      const body = req.body;
      if (!body) return {};
      if (typeof body === "object") return body;
      if (Buffer.isBuffer(body)) {
        try {
          return JSON.parse(body.toString("utf8"));
        } catch {
          return {};
        }
      }
      if (typeof body === "string") {
        try {
          return JSON.parse(body);
        } catch {
          return {};
        }
      }
      return {};
    };

    const { to, subject, text, html } = parseBody();

    if (!to || !subject || (!text && !html)) {
      return res
        .status(400)
        .json({ error: "to, subject, and text/html are required" });
    }

    const { from, transport } = buildTransportConfig();
    const transporter = nodemailer.createTransport(transport);

    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Mail send error:", err);
    return res.status(500).json({ error: err.message });
  }
}

const __filename = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  dotenv.config();

  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.all("*", (req, res) => handler(req, res));

  const port = Number(process.env.PORT) || 3001;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Mailer running on http://localhost:${port}`);
  });
}
