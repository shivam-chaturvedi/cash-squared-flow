import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { forceEnglishOnBoot } from "@/lib/googleTranslate";

forceEnglishOnBoot();

createRoot(document.getElementById("root")!).render(<App />);
