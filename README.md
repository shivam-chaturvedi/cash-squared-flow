# Cash Squared Flow

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

