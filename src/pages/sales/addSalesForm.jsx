import { useState } from "react";
import supabase from "../../hooks/useSupabase.js";

function AddSalesForm() {
    const [vente, setVente] = useState([]); // Liste des articles vendus
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState("");

    // 📌 Scanner / Chercher un article
    const searchArticle = async () => {
        if (!searchTerm) return;
        const { data, error } = await supabase
            .from("articles")
            .select("*")
            .ilike("name", `%${searchTerm}%`)
            .single();

        if (error || !data) {
            setMessage("Article non trouvé !");
            return;
        }

        // Vérifier si l'article est déjà dans la vente
        const existingItem = vente.find((item) => item.id === data.idArticle);
        if (existingItem) {
            setVente(vente.map((item) =>
                item.id === data.idArticle ? { ...item, quantite: item.quantite + 1 } : item
            ));
        } else {
            setVente([...vente, { ...data, quantite: 1 }]);
        }

        setSearchTerm("");
    };

    // 📌 Mettre à jour la quantité d'un article
    const updateQuantite = (id, quantite) => {
        setVente(vente.map((item) =>
            item.id === id ? { ...item, quantite: quantite } : item
        ));
    };

    // 📌 Calculer le total (avec `sell_price` depuis la table articles)
    const totalVente = vente.reduce((total, item) => total + item.quantite * item.sell_price, 0);

    // 📌 Valider la vente
    const validerVente = async () => {
        if (vente.length === 0) return;

        try {
            // 1️⃣ Insérer la vente
            const { data: venteData, error: venteError } = await supabase
                .from("ventes")
                .insert([{ total: totalVente }])
                .select('*')
                .single();

            if (venteError) throw venteError;

            // 2️⃣ Insérer les détails de vente
            for (const item of vente) {
                await supabase.from("ventes_details").insert([{
                    id_vente: venteData.id,
                    id_article: item.idArticle,
                    quantite: item.quantite,
                    total: item.quantite * item.sell_price, // Utilisation de sell_price
                }]);

                // 3️⃣ Mettre à jour le stock
                await supabase
                    .from("articles")
                    .update({ quantity: item.quantity - item.quantite })
                    .eq("idArticle", item.idArticle);
            }

            // 4️⃣ Réinitialiser la vente
            setVente([]);
            setMessage("Vente validée avec succès !");
        } catch (error) {
            setMessage(`Erreur : ${error.message}`);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold">Caisse</h2>

            {/* Barre de recherche */}
            <input
                type="text"
                placeholder="Scanner ou rechercher un article"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchArticle()}
                className="border p-2 rounded w-full"
            />

            {/* Liste des articles scannés */}
            <table className="w-full mt-4 border-collapse border border-gray-200">
                <thead>
                <tr className="bg-gray-100">
                    <th className="border p-2">Nom</th>
                    <th className="border p-2">Prix</th>
                    <th className="border p-2">Quantité</th>
                    <th className="border p-2">Total</th>
                </tr>
                </thead>
                <tbody>
                {vente.map((item) => (
                    <tr key={item.id}>
                        <td className="border p-2">{item.name}</td>
                        <td className="border p-2">{item.sell_price} €</td>
                        <td className="border p-2">
                            <input
                                type="number"
                                value={item.quantite}
                                onChange={(e) => updateQuantite(item.id, parseInt(e.target.value))}
                                className="w-16 p-1 border rounded"
                            />
                        </td>
                        <td className="border p-2">{(item.quantite * item.sell_price).toFixed(2)} €</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Total et validation */}
            <div className="mt-4">
                <h3 className="text-lg font-bold">Total : {totalVente.toFixed(2)} €</h3>
                <button
                    onClick={validerVente}
                    className="bg-green-500 text-white p-2 rounded mt-2"
                >
                    Valider la vente
                </button>
            </div>

            {/* Message d'état */}
            {message && <p className="mt-4 text-red-500">{message}</p>}
        </div>
    );
}

export default AddSalesForm;
