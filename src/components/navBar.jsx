import { localMode } from '../services/appMode.js';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import { logoutUser } from '../redux/features/authSlice.js';
export default function NavBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    const result = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(result)) navigate('/login', { replace: true });
    else setMessage(result.payload);
    setBusy(false);
  }
  return <header className="topbar"><div className="breadcrumb"><span>Espace de gestion</span><ChevronRight size={14} /><strong>{{ '/': 'Stock & commandes', '/catalogue': 'Catalogue', '/sales': 'Caisse', '/stats': 'Stats ventes', '/scan': 'Scanner', '/profile': 'Mon profil' }[pathname] || 'France Distribution'}</strong></div>
    <div className="topbar-actions"><time dateTime={new Date().toISOString().slice(0, 10)}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time>{!localMode && <button className="btn logout-button" disabled={busy} onClick={logout}><LogOut size={16} /><span>Se déconnecter</span></button>}</div>
    {message && <p role="alert">{message}</p>}
  </header>;
}
