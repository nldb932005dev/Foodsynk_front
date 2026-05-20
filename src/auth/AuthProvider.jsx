import { useMemo, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";


export function AuthProvider({ children }) {
 const [token, setToken] = useState(null);
 const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);

 // Rehidratar token y user desde sessionStorage al montar
 useEffect(() => {
   const savedToken = sessionStorage.getItem("token");
   if (savedToken) setToken(savedToken);

   const savedUser = sessionStorage.getItem("user");
   if (savedUser) {
     try {
       setUser(JSON.parse(savedUser));
     } catch {
       sessionStorage.removeItem("user");
     }
   }
   setLoading(false);
 }, []);

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