import { createAppState } from "./state/appState.js";
import { initializeViewPlaceholders } from "./views/index.js";

export const appState = createAppState();

function initializeApp() {
  initializeViewPlaceholders(document);
  document.documentElement.dataset.appStatus = "ready";
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
} else {
  initializeApp();
}
