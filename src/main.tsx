import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Portraid } from "./Portraid.tsx";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/service-worker.js")
    .catch((err) => console.error("SW registration failed:", err));
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Portraid />
  </StrictMode>
);
