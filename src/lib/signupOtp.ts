type SignupOtpPayload = {
  email: string;
  password: string;
  full_name?: string;
  age?: number | string | null;
};

import { sendEmail } from "@/lib/sendTestEmail";
import { setPendingSignup, setPendingSignupOtp } from "@/lib/pendingSignup";

export type SignupOtpResult = "otp_sent" | "signed_in";

export const requestSignupOtp = async (payload: SignupOtpPayload): Promise<SignupOtpResult> => {
  const email = payload.email.trim();
  const password = payload.password;
  const fullName = typeof payload.full_name === "string" ? payload.full_name.trim() : "";
  const ageRaw = payload.age;
  const age =
    typeof ageRaw === "number"
      ? ageRaw
      : typeof ageRaw === "string" && ageRaw.trim() && !Number.isNaN(Number(ageRaw))
        ? Number(ageRaw)
        : null;

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  setPendingSignup({
    email,
    password,
    ...(fullName ? { full_name: fullName } : {}),
    ...(typeof age === "number" ? { age } : {}),
  });
  setPendingSignupOtp({ value: otp, expiresAt });

  await sendEmail({
    to: email,
    subject: "OTP",
    text: `OTP: ${otp}`,
  });

  return "otp_sent";
};
