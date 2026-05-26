import { useMemo, useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/lib/supabaseClient";

const MAX_MESSAGE_LEN = 2000;
const DEFAULT_FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/1mx1LaBTDtMpXw7aQdSY5QoXLvrU1XMSYHkr6I3CZuA4/edit";

const FeedbackWidget = () => {
  const { session } = useApp();
  const location = useLocation();
  const userId = session?.user?.id ?? null;
 
  
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pagePath = useMemo(() => location.pathname + location.search + location.hash, [location]);
  const feedbackFormUrl =
    (import.meta.env.VITE_FEEDBACK_FORM_URL as string | undefined) || DEFAULT_FEEDBACK_FORM_URL;

  if (!userId) return null;

  const reset = () => {
    setRating(0);
    setMessage("");
    setStatus(null);
  };

  const submit = async () => {
    setStatus(null);
    if (!rating || rating < 1 || rating > 5) {
      setStatus("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("user_feedback").insert({
      user_id: userId,
      rating,
      message: message.trim() ? message.trim().slice(0, MAX_MESSAGE_LEN) : null,
      page_path: pagePath,
    });
    setSubmitting(false);
    if (error) {
      setStatus(error.message ?? "Unable to save feedback right now.");
      return;
    }
    setStatus("Thanks — feedback received.");
    window.setTimeout(() => {
      setOpen(false);
      reset();
    }, 700);
  };

  return (
    <>
      <a
        href={feedbackFormUrl}
        target="_blank"
        rel="noreferrer"
        className="h-14 w-16 rounded-xl border border-border bg-card shadow-sm flex items-center justify-center hover:bg-accent transition active:scale-95"
        aria-label="Open feedback form"
        title="Feedback"
      >
        <img src="/feedback.png" alt="" className="h-9 w-9 object-contain" aria-hidden="true" />
      </a>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close feedback"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          />

          <div className="absolute bottom-6 right-6 w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-border bg-card shadow-xl">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Feedback</p>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-3">
              {status && <p className={`text-xs ${status.startsWith("Thanks") ? "text-money-in" : "text-destructive"}`}>{status}</p>}

              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className="w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackWidget;
