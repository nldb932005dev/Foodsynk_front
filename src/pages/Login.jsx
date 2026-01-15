import { useState } from "react";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { useNavigate, Navigate } from "react-router-dom";
import styles from "./Login.module.css";


export default function Login() {
 const { token,setToken, setUser } = useAuth();
 const navigate = useNavigate();


 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);


if (token) return <Navigate to="/home" replace />;
 async function handleSubmit(e) {
   e.preventDefault();
   setError("");
   setLoading(true);


   try {
     const res = await api.post("/login", { email, password });


     setToken(res.data.token);
     setUser(res.data.user);


     navigate("/home");
   } catch (err) {
     console.error("LOGIN ERROR:", err);


     const msg =
       err?.response?.data?.message ||
       (typeof err?.response?.data === "string" ? err.response.data : "") ||
       (err?.response?.data ? JSON.stringify(err.response.data) : "") ||
       err?.message ||
       "Error al iniciar sesiÃ³n";


     setError(msg);
   } finally {
     setLoading(false);
   }
 }


 return (
   <div className={styles.container}>
     <h2 className={styles.title}>Login</h2>


     <form onSubmit={handleSubmit} className={styles.form}>
       <label className={styles.label}>
         Email
         <input
           className={styles.input}
           value={email}
           onChange={(e) => setEmail(e.target.value)}
           autoComplete="email"
         />
       </label>


       <label className={styles.label}>
         Password
         <input
           className={styles.input}
           value={password}
           onChange={(e) => setPassword(e.target.value)}
           type="password"
           autoComplete="current-password"
         />
       </label>


       <button className={styles.button} disabled={loading}>
         {loading ? "Entrando..." : "Entrar"}
       </button>


       {error && <div className={styles.error}>{error}</div>}
     </form>
   </div>
 );
}