import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import { useAuth } from "../auth/useAuth";


export default function Navbar() {
 const { setToken, setUser } = useAuth();
 const navigate = useNavigate();


 async function handleLogout() {
   try {
     await api.post("/logout");
   } catch (e) {
     console.warn("Error en logout backend");
   } finally {
     setToken(null);
     setUser(null);
     navigate("/", { replace: true });
   }
 }


 async function goToMyRecipes() {
   navigate("/my-Recipes");
 }


 return (
   <nav
     style={{
       display: "flex",
       gap: 12,
       padding: 12,
       borderBottom: "1px solid #ddd",
     }}
   >
     <button onClick={() => navigate("/home")}>Home</button>
     <button onClick={goToMyRecipes}>Mis Recetas</button>
     <button onClick={handleLogout}>Logout</button>
   </nav>
 );
}