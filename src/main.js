import { createAppState } from "./state/appState.js";
import { createVisualizationDataErrorState, loadVisualizationData } from "./data/loadVisualizationData.js";
import { initializeViews } from "./views/index.js";

export const appState = createAppState();

function showDataError(error) {
  const state = createVisualizationDataErrorState(error);
  const alert = document.createElement("section");
  alert.className = "data-error";
  alert.setAttribute("role", "alert");
  const title = document.createElement("h2");
  title.textContent = state.message;
  const detail = document.createElement("p");
  detail.textContent = state.detail;
  alert.append(title, detail);
  document.querySelector("#main-content").prepend(alert);
  document.documentElement.dataset.appStatus = "error";
}

async function initializeApp() {
  document.documentElement.dataset.appStatus = "loading";
  try {
    const data = await loadVisualizationData();
    initializeViews(document, data);
    document.documentElement.dataset.appStatus = "ready";
  } catch (error) {
    showDataError(error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp, { once: true });
} else {
  initializeApp();
}
