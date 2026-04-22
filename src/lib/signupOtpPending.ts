const STORAGE_KEY = "cash-squared-signup-otp-pending-email";

export const setPendingSignupOtpEmail = (email: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, email);
};

export const getPendingSignupOtpEmail = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(STORAGE_KEY) || "";
};

export const clearPendingSignupOtpEmail = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};

