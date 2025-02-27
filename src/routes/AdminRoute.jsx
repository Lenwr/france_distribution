/* eslint-disable */
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

const AdminRoute = ({ children }) => {
  const { profile, loading } = useAuth();

  if (loading) return <p>Chargement...</p>;

  return profile?.role === "admin" ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
};

export default AdminRoute;
