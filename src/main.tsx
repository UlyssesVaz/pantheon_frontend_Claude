
import React from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.tsx";
import "./index.css";

try {
  console.log("--- STORAGE TEST ---");
  localStorage.setItem('__auth0_test__', 'test');
  localStorage.removeItem('__auth0_test__');
  console.log("✅ Storage test passed.");
} catch (e) {
  console.error("❌ STORAGE TEST FAILED:", e);
  console.error("This is the bug. The browser is blocking localStorage, and Auth0 cannot initialize.");
  // We can even throw the error to stop the app from hanging
  throw new Error("Browser is blocking localStorage. Auth0 SDK failed to initialize.");
}

// ⬇️ ADD THESE LOGS
console.log("--- VITE ENV CHECK ---");
console.log("VITE_AUTH0_DOMAIN:", import.meta.env.VITE_AUTH0_DOMAIN);
console.log("VITE_AUTH0_CLIENT_ID:", import.meta.env.VITE_AUTH0_CLIENT_ID);
console.log("VITE_AUTH0_AUDIENCE:", import.meta.env.VITE_AUTH0_AUDIENCE);
// ⬆️ END OF LOGS

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Validate Auth0 configuration
if (!domain || !clientId || !audience) {
  console.error("Auth0 configuration missing. Please check your .env file.");
  console.error("Required environment variables:");
  console.error("- VITE_AUTH0_DOMAIN");
  console.error("- VITE_AUTH0_CLIENT_ID");
  console.error("- VITE_AUTH0_AUDIENCE");
  throw new Error("Auth0 domain and client ID must be set in .env file");
}

// Validate domain format
if (!domain.includes('.auth0.com') && !domain.includes('.us.auth0.com') && !domain.includes('.eu.auth0.com') && !domain.includes('.au.auth0.com')) {
  console.warn("Auth0 domain format might be incorrect. Expected format: your-domain.auth0.com");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  //<React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,  // ← Add this
        //scope: 'openid profile email offline_access'  // ← Add this
      }}
      //cacheLocation="localstorage"
      //useRefreshTokens={true}
    >
      <App />
    </Auth0Provider>
  //</React.StrictMode>
);  