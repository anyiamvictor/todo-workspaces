import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext/AuthContext";

function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    // Redirect to auth page if not logged in
    return <Navigate to="/auth" replace />;
  }

  // Render the protected component if authenticated
  return children;
}

export default ProtectedRoute;
