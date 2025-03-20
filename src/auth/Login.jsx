/* eslint-disable */
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import { loginUser } from "../redux/features/authSlice";
import { supabase } from "../hooks/useSupabase.js";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useDispatch();
    
    const navigate = useNavigate();
    const { loading, error, user } = useSelector((state) => state.auth); // Récupération de l'état Re
       
    
        const handleLogin = async (e) => {
            e.preventDefault();
    
            const result = await dispatch(loginUser({ email, password }));
    
            if (result.meta.requestStatus === "fulfilled") {
                alert("Connexion réussie !");
                navigate("/"); // Redirige après succès
            }
        };
    

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
            {/* Arrière-plan avec effet de flou */}
            <div className="absolute inset-0 bg-[url(/loginPage.jpg)] bg-cover bg-center blur-sm"></div>

            {/* Contenu principal */}
            <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md relative z-10">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
                    France Distribution
                </h2>
                <h3 className="text-2xl font-semibold text-center text-gray-700 mb-6">
                    Connexion
                </h3>

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Champ Email */}
                    <div className="relative">
                        <label className="block text-gray-700 font-medium">Email</label>
                        <div className="flex items-center border rounded-lg overflow-hidden">
                            <Mail className="mx-3 text-gray-400" />
                            <input
                                type="email"
                                placeholder="Votre email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Champ Mot de passe */}
                    <div className="relative">
                        <label className="block text-gray-700 font-medium">Mot de passe</label>
                        <div className="flex items-center border rounded-lg overflow-hidden">
                            <Lock className="mx-3 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Votre mot de passe"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="px-3 text-gray-500 hover:text-gray-700 transition-all"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Bouton de connexion */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:bg-gray-400"
                    >
                        {loading ? "Connexion..." : "Se connecter"}
                    </button>
                </form>

                {/* Message d'erreur */}
                {error && (
                    <p className="text-red-500 text-center mt-4 animate-pulse">
                        {error}
                    </p>
                )}

                {/* Lien d'inscription */}
                
            </div>
        </div>
    );
}
