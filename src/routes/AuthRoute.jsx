import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
export default function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p role="status">Chargement de votre session…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

AuthRoute.propTypes = { children: PropTypes.node.isRequired };
