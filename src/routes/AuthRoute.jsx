/* eslint-disable */
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) return <p>Chargement...</p>;

  return user ? children : <Navigate to="/login" replace />;
};

export default AuthRoute;

