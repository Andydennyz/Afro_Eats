import { HerculesAuthProvider } from "@usehercules/auth/react";

const authority = import.meta.env.VITE_HERCULES_OIDC_AUTHORITY?.trim();
const clientId = import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID?.trim();

if (!authority || !clientId) {
  throw new Error(
    "Authentication is not configured. Set VITE_HERCULES_OIDC_AUTHORITY and VITE_HERCULES_OIDC_CLIENT_ID in Afro-Eats/.env.local, then restart Vite.",
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <HerculesAuthProvider
      authority={authority}
      client_id={clientId}
      userManagerSettings={{
        prompt: import.meta.env.VITE_HERCULES_OIDC_PROMPT ?? "select_account",
        response_type:
          import.meta.env.VITE_HERCULES_OIDC_RESPONSE_TYPE ?? "code",
        scope:
          import.meta.env.VITE_HERCULES_OIDC_SCOPE ??
          "openid profile email offline_access",
        redirect_uri:
          import.meta.env.VITE_HERCULES_OIDC_REDIRECT_URI ??
          `${window.location.origin}/auth/callback`,
      }}
    >
      {children}
    </HerculesAuthProvider>
  );
}
