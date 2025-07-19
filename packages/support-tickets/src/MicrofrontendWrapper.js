import React from "react";
import App from "./App.js";

// Wrapper component for microfrontend usage that ensures proper React context
function MicrofrontendWrapper(props) {
  // Ensure we're using the host's React instance
  if (typeof window !== "undefined" && window.React) {
    return window.React.createElement(App, props);
  }

  return React.createElement(App, props);
}

export default MicrofrontendWrapper;
