import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./styles.css";

// Only render if running as standalone app (not as microfrontend)
if (typeof window !== "undefined" && !window.__POWERED_BY_QIANKUN__) {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
}
