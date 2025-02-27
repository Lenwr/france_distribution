/* eslint-disable */
import {useEffect, useRef, useState} from "react";
import {supabase} from "../../hooks/useSupabase.js";
import jsPDF from "jspdf";
import "jspdf-autotable";

function Sales(props) {
    const [venteId, setVenteId] = useState(null);
    const [vente, setVente] = useState([]); // Liste des articles vendus
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState("");
    const searchInputRef = useRef(null); // Référence pour l'input

    // 📌 Débuter une nouvelle vente
    const debuterVente = async () => {
        const { data, error } = await supabase.from("ventes").insert([{ total: 0 }]).select("*").single();
        if (error) {
            setMessage("Erreur lors du démarrage de la vente");
            return;
        }
        setVenteId(data.id);
        setVente([]);
        setMessage("Nouvelle vente démarrée !");
    };
    // 🎯 Autofocus sur l'input
    setTimeout(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, 100);

    // 📌 Scanner un article
    const searchArticle = async () => {
        if (!searchTerm) return;

        console.log(searchTerm);

        const { data, error } = await supabase
            .from("articles")
            .select("*")
            .eq("code_ref" , searchTerm)
            .single();

        if (error || !data) {
            setMessage("Article non trouvé !");
            return;
        }

        const existingItem = vente.find((item) => item.idArticle === data.idArticle);
        if (existingItem) {
            setVente(vente.map((item) =>
                item.idArticle === data.idArticle ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setVente([...vente, { ...data, quantity: 1 }]);
        }

        setSearchTerm("");
    };
    // 🎯 Autofocus sur l'input après scan
    setTimeout(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, 100);

    // 📌 Mettre à jour la quantité
    const updateQuantity = (id, quantity) => {
        setVente(vente.map((item) =>
            item.idArticle === id ? { ...item, quantity: quantity } : item
        ));
    };

    // 📌 Calculer le total
    const totalVente = vente.reduce((total, item) => total + item.quantity * item.sell_price, 0);

    // 📌 Finaliser la vente
    const validerVente = async () => {
        if (!venteId || vente.length === 0) return;

        try {
            // 1️⃣ Mettre à jour la vente avec le total
            await supabase.from("ventes").update({ total: totalVente }).eq("id", venteId);

            // 2️⃣ Insérer les détails de vente
            for (const item of vente) {
                await supabase.from("ventes_details").insert([{
                    id_vente: venteId,
                    id_article: item.idArticle,
                    prix_unitaire:item.sell_price,
                    quantity: item.quantity,
                    total: item.quantity * item.sell_price,
                }]);

                // 3️⃣ Mettre à jour le stock
                await supabase
                    .from("articles")
                    .update({ quantity: item.quantity - item.quantity })
                    .eq("idArticle", item.idArticle);
            }

            // 4️⃣ Générer la facture PDF
            genererFacturePDF();

            // 5️⃣ Réinitialiser la vente
            setVenteId(null);
            setVente([]);
            setMessage("Vente validée avec succès !");
        } catch (error) {
            setMessage(`Erreur : ${error.message}`);
        }
    };

    // 📌 Générer le PDF de la facture
    const genererFacturePDF = () => {
        const doc = new jsPDF();
        doc.text("Facture", 10, 10);

        // Ajouter un tableau
        const tableData = vente.map((item) => [
            item.name,
            item.quantity,
            item.sell_price + " FCFA",
            (item.quantity * item.sell_price) + " FCFA",
        ]);

        doc.autoTable({
            head: [["Article", "Quantité", "Prix Unitaire", "Total"]],
            body: tableData,
        });

        doc.text(`Total: ${totalVente.toFixed(2)} €`, 10, doc.lastAutoTable.finalY + 10);

        // Télécharger le fichier
        doc.save("facture.pdf");
    };

    // 📌 useEffect pour re-focus sur l'input si venteId change
    useEffect(() => {
        if (venteId && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [venteId]);

    return (
        <div className="p-4 h-screen bg-white">
            <h2 className="text-xl text-black font-bold">Caisse</h2>

            {/* Démarrer une nouvelle vente */}
            <button
                onClick={debuterVente}
                className="bg-blue-500 text-white p-2 rounded"
            >
                Démarrer une vente
            </button>

            {/* Scanner un article */}
            <input
                type="text"
                ref={searchInputRef} // Ajout du ref ici
                placeholder="Scanner un article"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchArticle()}
                className="border p-2 rounded bg-gray-600 font-semibold text-white w-full mt-4"
                disabled={!venteId}
            />

            {/* Liste des articles */}
            <table className="w-full mt-4 border-collapse border border-gray-200">
                <thead>
                <tr className="bg-gray-400">
                    <th className="border text-black p-2">Nom</th>
                    <th className="border text-black p-2">Prix</th>
                    <th className="border text-black p-2">Quantité</th>
                    <th className="border text-black p-2">Total</th>
                </tr>
                </thead>
                <tbody>
                {vente.map((item) => (
                    <tr key={item.idArticle}>
                        <td className="border text-black p-2">{item.name}</td>
                        <td className="border text-black p-2">{item.sell_price} FCA </td>
                        <td className="border text-black p-2">
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.idArticle, parseInt(e.target.value))}
                                className="w-16 p-1 bg-white text-black border rounded"
                            />
                        </td>
                        <td className="border text-black p-2">{(item.quantity * item.sell_price).toFixed(2)} CFA</td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* Total et validation */}
            <div className="mt-4">
                <h3 className="text-lg text-black font-bold">Total : {totalVente.toFixed(2)} FCFA </h3>
                <button
                    onClick={validerVente}
                    className="bg-green-500 text-white p-2 rounded mt-2"
                    disabled={!venteId || vente.length === 0}
                >
                    Finaliser la vente
                </button>
            </div>

            {/* Message d'état */}
            {message && <p className="mt-4 text-red-500">{message}</p>}
        </div>
    );
}

export default Sales;
