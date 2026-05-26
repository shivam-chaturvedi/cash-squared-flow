type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
  }
}

const isBrowser = typeof window !== "undefined";

const doNotTrackEnabled = () => {
  if (!isBrowser) return false;
  const dnt = (navigator as unknown as { doNotTrack?: string | null }).doNotTrack;
  return dnt === "1" || dnt === "yes";
};

export const trackEvent = (name: string, params?: Record<string, unknown>) => {
  if (!isBrowser) return;
  if (doNotTrackEnabled()) return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", name, params ?? {});
};

export const trackPageView = (path: string) => {
  trackEvent("page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
};

export const startClickTracking = () => {
  if (!isBrowser) return () => {};
  if (doNotTrackEnabled()) return () => {};
  const enabled = String(import.meta.env.VITE_GA_CLICK_TRACKING ?? "").toLowerCase() === "true";
  if (!enabled) return () => {};

  const handler = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const el = target.closest<HTMLElement>("a,button,[role='button']");
    if (!el) return;
    if (el.closest("input,textarea,select,label")) return;
    if (el.getAttribute("data-analytics") === "ignore") return;

    const tag = el.tagName.toLowerCase();
    const ariaLabel = el.getAttribute("aria-label") || "";
    const text = (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80);
    const label = (el.getAttribute("data-analytics-label") || ariaLabel || text || tag).slice(0, 80);

    const href =
      tag === "a" && el instanceof HTMLAnchorElement
        ? (() => {
          try {
            const u = new URL(el.href, window.location.href);
            return u.origin === window.location.origin ? u.pathname + u.search + u.hash : u.origin;
          } catch {
            return null;
          }
        })()
        : null;

    trackEvent("ui_click", {
      page_path: window.location.pathname + window.location.search + window.location.hash,
      element_type: tag,
      element_label: label,
      ...(href ? { link_target: href } : {}),
    });
  };

  document.addEventListener("click", handler, { capture: true });
  return () => document.removeEventListener("click", handler, { capture: true } as AddEventListenerOptions);
};

