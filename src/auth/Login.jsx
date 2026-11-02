import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../redux/features/authSlice";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();

    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth); // Récupération de l'état Re


        const handleLogin = async (e) => {
            e.preventDefault();

            const result = await dispatch(loginUser({ email, password }));

            if (result.meta.requestStatus === "fulfilled") {
                navigate("/"); // Redirige après succès
            }
        };


    return <main className="login-layout">
      <section className="login-story">
        <div className="brand"><span className="brand-mark">fd<span>.</span></span><span>France<br /><strong>Distribution</strong></span></div>
        <div className="login-story-content"><p className="eyebrow">LE COMMERCE, SIMPLEMENT.</p><h1>Gardez une longueur<br />d’avance sur<br /><em>votre activité.</em></h1><p>Du premier carton réceptionné au dernier article vendu, retrouvez l’essentiel au même endroit.</p>
          <div className="logistics-art" aria-hidden="true"><div className="art-orbit" /><div className="art-box box-one"><span>FD</span></div><div className="art-box box-two"><span>↑ ↑</span></div><div className="art-box box-three"><span>FRANCE<br />DISTRIBUTION</span></div><div className="art-label">DU STOCK À LA VENTE <span>↗</span></div></div>
        </div>
        <div className="login-story-footer"><span>Stock · Approvisionnements · Caisse</span><span>DÉTAIL & GROS</span></div>
      </section>
      <section className="login-form-side"><div className="login-form-card"><span className="login-badge"><Lock size={15} /> Votre espace professionnel</span><h2>Heureux de vous<br />retrouver.</h2><p className="page-description">Connectez-vous pour gérer votre activité.</p>
        <form onSubmit={handleLogin} className="login-form">
          <label htmlFor="login-email">Email</label><div className="login-input"><Mail size={18} /><input type="email" id="login-email" required autoComplete="username" placeholder="vous@entreprise.com" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <label htmlFor="login-password">Mot de passe</label><div className="login-input"><Lock size={18} /><input id="login-password" required autoComplete="current-password" type={showPassword ? 'text' : 'password'} placeholder="Votre mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          {error && <p role="alert" className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>{loading ? 'Connexion…' : 'Se connecter'}<span aria-hidden="true">→</span></button>
        </form><p className="login-help">Un problème d’accès ? Contactez votre administrateur.</p>
      </div><p className="login-bottom">FRANCE DISTRIBUTION <span>La gestion qui vous simplifie la journée.</span></p></section>
    </main>;
}
