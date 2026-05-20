import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function AdminRoute() {
  const { token, user, loading } = useAuth();

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.is_admin) return <Navigate to="/" replace />;

  return <Outlet />;
}
