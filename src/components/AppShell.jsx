import { localMode } from '../services/appMode.js';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import { Boxes, ScanLine, ShoppingBag, ArrowUpRight, UserRound, Store, BarChart3, ReceiptText } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.jsx';
import NavBar from './navBar.jsx';

export default function AppShell({ children }) {
  const { profile, user } = useAuth();
  const { pathname } = useLocation();
  const name = profile?.username || user?.email || 'Mon compte';
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Aller au contenu</a>
    <aside className="sidebar">
      <NavLink to="/" className="brand"><span className="brand-mark">fd<span>.</span></span><span>France<br /><strong>Distribution</strong></span></NavLink>
      <p className="nav-caption">ESPACE DE GESTION</p>
      <nav aria-label="Navigation principale" className="side-links">
        {profile?.role === 'admin' && <>
          <NavLink to="/" end><Boxes size={19} /><span>Stock & commandes</span></NavLink>
          <NavLink to="/catalogue"><Store size={19} /><span>Catalogue</span></NavLink>
          <NavLink to="/stats"><BarChart3 size={19} /><span>Stats ventes</span></NavLink>
          <NavLink to="/purchases"><ReceiptText size={19} /><span>Achats & tickets</span></NavLink>
          <NavLink to="/sales"><ShoppingBag size={19} /><span>Caisse</span><ArrowUpRight size={16} className="nav-arrow" /></NavLink>
          <NavLink to="/scan"><ScanLine size={19} /><span>Scanner un produit</span></NavLink>
        </>}
        {!localMode && <NavLink to="/profile"><UserRound size={19} /><span>Mon profil</span></NavLink>}
      </nav>
      <div className="sidebar-note"><span className="note-dot" /><p>Du stock à la vente.<br /><strong>Tout au même endroit.</strong></p><span className="business-tag">DÉTAIL & GROS</span></div>
      <div className="sidebar-user"><span className="user-avatar">{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{localMode ? 'Sans connexion' : profile?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</small></div></div>
    </aside>
    <div className="workspace">
      <NavBar />
      <div className="workspace-content" id="main-content" tabIndex={-1} key={pathname}>{children}</div>
      <footer className="workspace-footer"><span>France Distribution</span><span>{localMode ? "Données conservées dans ce navigateur" : "Votre commerce, au quotidien."}</span></footer>
    </div>
  </div>;
}
AppShell.propTypes = { children: PropTypes.node.isRequired };
