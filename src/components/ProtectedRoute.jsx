import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext/AuthContextFirebase";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // or a spinner/loading UI

  return user ? children : <Navigate to="/auth" replace />;
}

export default ProtectedRoute;
