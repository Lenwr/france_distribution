/* eslint-disable */
import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import de useNavigate
import { supabase } from "../hooks/useSupabase.js";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialisation du navigate

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            alert("Connexion réussie !");
            navigate("/"); // Redirection vers Dashboard après connexion
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center  justify-center bg-gradient-to-br from-gray-900 to-gray-700">
            <div className="bg-white px-8 py-16 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Connexion
                </h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 font-medium">Email</label>
                        <input
                            type="email"
                            placeholder="Votre email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium">Mot de passe</label>
                        <input
                            type="password"
                            placeholder="Votre mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 disabled:bg-gray-400"
                    >
                        {loading ? "Connexion..." : "Se connecter"}
                    </button>
                </form>
                {error && (
                    <p className="text-red-500 text-center mt-3">{error}</p>
                )}
                <p className="text-gray-500 text-center mt-4 hidden">
                    Pas encore de compte ? <a href="/signup"
                                              className="text-blue-600 font-medium hover:underline">Inscrivez-vous</a>
                </p>
            </div>
        </div>
    );
}
