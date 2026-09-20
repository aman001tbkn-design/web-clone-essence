import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

const RequireAuth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
};

export default RequireAuth;
