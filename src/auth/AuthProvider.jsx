import { useMemo, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";

function getStoredUser() {
  const savedUser = sessionStorage.getItem("user");

  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    sessionStorage.removeItem("user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));
  const [user, setUser] = useState(getStoredUser);
  const [loading] = useState(false);

  // Sincronizar token con sessionStorage
  useEffect(() => {
    if (token) {
      sessionStorage.setItem("token", token);
    } else {
      sessionStorage.removeItem("token");
    }
  }, [token]);

  // Sincronizar user con sessionStorage
  useEffect(() => {
    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("user");
    }
  }, [user]);


  const value = useMemo(
    () => ({ token, setToken, user, setUser, loading }),
    [token, user, loading]
  );


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
