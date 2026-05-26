export const DEFAULT_FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSf5gubmbXdRczS8iUJUMSHU68R_HT0Efb5qjVS5W3Z-tE9N7g/viewform?usp=publish-editor";

export const getFeedbackFormUrl = () =>
  (import.meta.env.VITE_FEEDBACK_FORM_URL as string | undefined) || DEFAULT_FEEDBACK_FORM_URL;
