import { createRoot } from "react-dom/client";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

// Send the HMAC-signed auth token as a Bearer header on every API call.
// This bypasses session-cookie/SameSite issues on cross-origin deployments.
setAuthTokenGetter(() => localStorage.getItem("gg_auth_token"));

createRoot(document.getElementById("root")!).render(<App />);
