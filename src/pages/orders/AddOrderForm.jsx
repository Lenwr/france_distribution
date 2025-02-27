/* eslint-disable */
import React, {useEffect, useState} from 'react';
import {supabase} from "../../hooks/useSupabase.js";
import {useProducts} from "../../hooks/useProduct.js";

function AddOrderForm(props) {
    const [quantity, setQuantity] = useState('');
    const [message, setMessage] = useState('');
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [selectedArticle , setSelectedArticle] = useState();

    // Filtrer les articles en fonction du terme recherché
    const filteredArticles = articles.filter(article =>
        article.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const {getProducts} = useProducts();
    const fetchArticles = async () => {
        try {
            setLoading(true);
            const data = await getProducts(); // Appelle la fonction du hook
            setArticles(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchArticles();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page

        // Validation simple
        if (!quantity || quantity <= 0) {
            setMessage('Veuillez remplir le champ.');
            return;
        }

        try {
            // 1️⃣ Ajouter la commande dans la table `commandes`
            const { data, error } = await supabase.from('commandes').insert([
                {
                    idArticle: selectedArticle,
                    quantity: parseInt(quantity, 10),
                    name: searchTerm,
                    statut: "En cours",
                },
            ]).select('*').single(); // On récupère directement l'objet inséré

            if (error) throw error;

            // 2️⃣ Copier la commande dans `commandes_historique`
            const { error: errorHistorique } = await supabase.from('commandes_historique').insert([
                {
                    id_commande: data.id,  // ID de la commande ajoutée
                    id_article: data.idArticle,
                    quantity: data.quantity,
                    name: data.name,
                    date_commande: new Date(), // Date actuelle
                },
            ]);

            if (errorHistorique) throw errorHistorique;

            // 3️⃣ Réinitialiser le formulaire et afficher un message de succès
            setQuantity("");
            setSearchTerm("");
            setMessage('Commande ajoutée avec succès !');
        } catch (error) {
            setMessage(`Erreur : ${error.message}`);
        }
    };

    return (
        <div>
            <div className="container ">
                <h2 className="m-2">Faire une nouvelle Commande</h2>
                <form onSubmit={handleSubmit}>
                    <div>

                        <div className="relative w-[30em]">
                            {/* Champ de recherche */}
                            <input
                                type="text"
                                placeholder="Rechercher un article..."
                                className="input input-bordered w-full bg-white mb-2"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Délai pour cliquer sur un élément
                            />

                            {/* Liste déroulante des articles filtrés */}
                            {isFocused && searchTerm && (
                                <div
                                    className="absolute bg-white w-full max-h-[15em] overflow-y-scroll rounded-box shadow-lg z-10">
                                    {filteredArticles.length > 0 ? (
                                        filteredArticles.map((article) => (
                                            <div
                                                className="p-2 hover:bg-cyan-50 cursor-pointer"
                                                key={article.id}
                                                onClick={() => {
                                                    setSearchTerm(article.name);
                                                    setSelectedArticle(article.idArticle)// Sélectionne l'article
                                                    setIsFocused(false); // Ferme la liste
                                                }}
                                            >
                                                {article.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-2 text-gray-500">Aucun article trouvé</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <label className=" my-4 input input-bordered flex bg-white items-center gap-2">
                            <input type="text"
                                   id="name"
                                   value={quantity}
                                   onChange={(e) => setQuantity(e.target.value)}
                                   placeholder="Quantité" className="grow "/>
                        </label>
                    </div>
                    <button className="mt-4 text-white btn bg-green-700" type="submit">Ajouter</button>
                </form>
                {message && <p>{message}</p>}
            </div>
        </div>
    );
}

export default AddOrderForm;
