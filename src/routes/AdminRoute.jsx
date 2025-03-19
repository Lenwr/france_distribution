/* eslint-disable */
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "../auth/AuthProvider.jsx"; 


const AdminRoute = ({ children }) => {
  const { user, role, loading } = useSelector((state) => state.auth);
  const { profile, ploading } = useAuth();

  if (loading) return <p>Chargement...</p>;

  return user && profile?.role === "admin" ? children : <Navigate to="/login" replace />;
};

export default AdminRoute;

