type PendingSignupPayload = {
  email: string;
  password: string;
  full_name?: string;
  age?: number | null;
};

const SIGNUP_KEY = "cash-squared-pending-signup";
const OTP_KEY = "cash-squared-pending-signup-otp";

type StoredOtp = {
  value: string;
  expiresAt: number;
};

export const setPendingSignup = (payload: PendingSignupPayload) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SIGNUP_KEY, JSON.stringify(payload));
};

export const getPendingSignup = (): PendingSignupPayload | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SIGNUP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingSignupPayload;
  } catch {
    return null;
  }
};

export const clearPendingSignup = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SIGNUP_KEY);
};

export const setPendingSignupOtp = (otp: StoredOtp) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(OTP_KEY, JSON.stringify(otp));
};

export const getPendingSignupOtp = (): StoredOtp | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(OTP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredOtp;
  } catch {
    return null;
  }
};

export const clearPendingSignupOtp = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(OTP_KEY);
};

