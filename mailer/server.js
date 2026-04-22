import nodemailer from "nodemailer";
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

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

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
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
