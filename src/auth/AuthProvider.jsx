import { useMemo, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";


export function AuthProvider({ children }) {
 const [token, setToken] = useState(null);
 const [user, setUser] = useState(null);


 useEffect(() => {
   const savedToken = sessionStorage.getItem("token");
   if (savedToken) setToken(savedToken);
 }, []);


 useEffect(() => {
   if (token) {
     sessionStorage.setItem("token", token);
   } else {
     sessionStorage.removeItem("token");
   }
 }, [token]);


 const value = useMemo(
   () => ({ token, setToken, user, setUser }),
   [token, user]
 );


 return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}