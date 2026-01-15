import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";


export default function ProtectedRoute() {
 const { token } = useAuth();
 if (!token) return <Navigate to="/" replace />;
 return <Outlet />;
}