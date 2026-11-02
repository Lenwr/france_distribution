import { useEffect, useState } from "react";
import { supabase } from "../../hooks/useSupabase.js";
import { useAuth } from "../../auth/AuthProvider.jsx";

export default function Account() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");
    const [website, setWebsite] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        setUsername(profile?.username || "");
        setWebsite(profile?.website || "");
        setAvatarUrl(profile?.avatar_url || "");
    }, [profile]);

    async function updateProfile(event) {
        event.preventDefault();

        if (!user) {
            setMessage("Utilisateur non connecté.");
            return;
        }

        setLoading(true);
        setMessage("");

        const updates = {
            username,
            website,
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
        };

        const { error } = profile
            ? await supabase.from("profiles").update(updates).eq("id", user.id)
            : await supabase.from("profiles").upsert({ id: user.id, role: "user", ...updates });

        setLoading(false);
        setMessage(error ? error.message : "Profil mis à jour.");
    }

    return (
        <main className="profile-page"><div className="page-heading"><div><p className="eyebrow">VOTRE ESPACE</p><h1>Mon profil</h1><p className="page-description">Les informations de votre compte professionnel.</p></div></div>
            <form onSubmit={updateProfile} className="profile-card flex flex-col gap-4">
                <h2 className="text-xl font-bold">Informations personnelles</h2>

                <label className="flex flex-col gap-1">
                    Email
                    <input className="input input-bordered bg-gray-100" type="email" value={user?.email || ""} disabled />
                </label>

                <label className="flex flex-col gap-1">
                    Nom
                    <input
                        className="input input-bordered bg-white"
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>

                <label className="flex flex-col gap-1">
                    Site web
                    <input
                        className="input input-bordered bg-white"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                    />
                </label>

                <div className="flex flex-wrap gap-3">
                    <button className="btn bg-green-700 text-white" type="submit" disabled={loading}>
                        {loading ? "Mise à jour..." : "Mettre à jour"}
                    </button>

                </div>

                {message && <p role="status" className="text-sm text-gray-700">{message}</p>}
            </form>
        </main>
    );
}
