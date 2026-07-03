# Avail

## Signup OTP (Vercel)

The UI calls `POST /api/request-signup-otp` to generate a Supabase signup OTP and send it via the mailer microservice.

### Required environment variables (Vercel → Project → Settings → Environment Variables)

- `SUPABASE_URL` (same value as `VITE_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (Supabase service role key; **server-only**)
- `MAILER_URL` (example: `https://avail-mailer.vercel.app/`)

Optional:

- `CORS_ALLOW_ORIGIN` (defaults to `*`)

### Local development

- Frontend only: `npm run dev` (OTP will 404 unless you point `VITE_API_BASE_URL` to a deployed domain that has `/api/request-signup-otp`).
- Full stack locally: run with `vercel dev` so `/api/*` functions work.

## Mailer SMTP configuration

The `mailer/` service supports either Gmail or any standard SMTP mailbox.

### Gmail

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`

### Generic SMTP / Hostinger

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM` (optional, defaults to `SMTP_USER`)

Example Hostinger mailbox configuration:

- `SMTP_HOST=smtp.hostinger.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=your-full-mailbox@example.com`
- `SMTP_PASS=your-mailbox-password`
- `MAIL_FROM=your-full-mailbox@example.com`

Important: if `SMTP_HOST` is set, the mailer uses SMTP settings and does not try Gmail.
