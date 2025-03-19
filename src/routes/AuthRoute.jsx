/* eslint-disable */
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return <p>Chargement...</p>; // Attendre que checkSession finisse
  }

  if (!user) {
    console.log("Redirection vers /login car user est null");
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AuthRoute;


