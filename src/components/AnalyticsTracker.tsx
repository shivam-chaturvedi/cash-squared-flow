import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { startClickTracking, trackEvent, trackPageView } from "@/lib/analytics";

const AnalyticsTracker = () => {
  const location = useLocation();
  const { mode, language, currency, translateLang } = useApp();

  useEffect(() => {
    const path = location.pathname + location.search + location.hash;
    trackPageView(path);
  }, [location.hash, location.pathname, location.search]);

  useEffect(() => {
    // Helps GA reporting for segmentation.
    trackEvent("app_preferences", { mode, language, currency, translate_language: translateLang });
  }, [currency, language, mode, translateLang]);

  useEffect(() => {
    return startClickTracking();
  }, []);

  return null;
};

export default AnalyticsTracker;

