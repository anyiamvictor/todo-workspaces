import React from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext/AuthContextFirebase";

function RoleProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { groupId } = useParams(); // ✅ for admin routes

  // ⏳ Wait until auth is ready
  if (loading) return null;

  // ❌ Not logged in
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // ❌ Wrong role or wrong group
  if (
    !allowedRoles.includes(user.role) ||
    (groupId && user.groupId !== groupId)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Authorized
  return children;
}

export default RoleProtectedRoute;
