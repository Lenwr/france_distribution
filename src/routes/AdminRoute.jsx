import PropTypes from 'prop-types';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.jsx';
export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <p role="status">Chargement de votre session…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role !== 'admin') return <main className="p-8"><h1 className="text-2xl">Accès réservé aux administrateurs</h1><p>Demandez à votre administrateur de vérifier vos droits.</p><Link className="btn mt-4" to="/profile">Mon profil</Link></main>;
  return children;
}

AdminRoute.propTypes = { children: PropTypes.node.isRequired };
