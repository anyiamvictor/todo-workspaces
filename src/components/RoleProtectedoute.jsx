import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext/AuthContext";

function RoleProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const location = useLocation();

  // Not logged in
  if (!user || user === null) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Logged in but not allowed
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Authorized
  return children;
}

export default RoleProtectedRoute;
