import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const TenantContext = createContext();

export function TenantProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("insightx_auth");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const handleInvalidAuth = () => {
      setAuth(null);
    };

    window.addEventListener("insightx_auth_invalid", handleInvalidAuth);
    return () =>
      window.removeEventListener("insightx_auth_invalid", handleInvalidAuth);
  }, []);

  const currentTenant = auth?.tenant || null;
  const isAuthority = auth?.email === "admin@insightx.com";

  const login = async (email, password) => {
    const res = await api.post("/tenants/login", { email, password });
    const data = res.data;

    // Normalize response for the authority vs normal user since the backend previously split them
    const normalizedAuth = {
      role: data.role,
      apiKey: data.apiKey,
      email,
      tenant: data.tenant || {
        email,
        name: "Demo App Authority",
        apiKey: data.apiKey,
      },
    };

    setAuth(normalizedAuth);
    localStorage.setItem("insightx_auth", JSON.stringify(normalizedAuth));
    return normalizedAuth;
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("insightx_auth");
  };

  const updateApiKey = (newKey) => {
    const updatedAuth = { ...auth, apiKey: newKey };
    if (updatedAuth.tenant) {
      updatedAuth.tenant.apiKey = newKey;
    }
    setAuth(updatedAuth);
    localStorage.setItem("insightx_auth", JSON.stringify(updatedAuth));
  };

  return (
    <TenantContext.Provider
      value={{
        auth,
        currentTenant,
        isAuthority,
        login,
        logout,
        updateApiKey,
        isLoggedIn: !!auth,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
