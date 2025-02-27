/* eslint-disable */
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

const AuthRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <p>Chargement...</p>;

    return user ? children : <Navigate to="/login" replace />;
};

export default AuthRoute;
