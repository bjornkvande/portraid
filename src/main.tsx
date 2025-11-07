import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Portraid } from "./Portraid.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Portraid />
  </StrictMode>
);
