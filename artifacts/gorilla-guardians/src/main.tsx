import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// When deployed with the frontend and backend on separate origins (e.g. Netlify + Render),
// set VITE_API_URL to the backend root (e.g. https://gorilla-api.onrender.com).
// All generated API hooks call setBaseUrl() automatically from this point forward.
// Unset in local/Replit dev — relative paths work because the dev proxy handles them.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

createRoot(document.getElementById("root")!).render(<App />);
