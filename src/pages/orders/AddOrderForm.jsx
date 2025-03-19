/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { getAllArticles } from "../../redux/features/articlesSlice.js";
import { getAllOrders, addOrUpdateOrder } from "../../redux/features/ordersSlice.js";

const AddOrderForm = () => {
    const dispatch = useDispatch();
    const articles = useSelector((state) => state.articles.list);
    const { loading, error } = useSelector((state) => state.orders);

    const [quantity, setQuantity] = useState('');
    const [message, setMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);

    useEffect(() => {
        dispatch(getAllArticles());
    }, [dispatch]);

    const filteredArticles = articles.filter(article =>
        article.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!quantity || quantity <= 0) {
            setMessage('Veuillez entrer une quantité valide.');
            return;
        }

        if (!selectedArticle) {
            setMessage('Veuillez sélectionner un article.');
            return;
        }

        const newOrder = {
            idArticle: selectedArticle,
            quantity: parseInt(quantity, 10),
            name: searchTerm,
        };

        dispatch(addOrUpdateOrder(newOrder)).then((result) => {
            if (result.meta.requestStatus === "fulfilled") {
                dispatch(getAllOrders());
                setMessage("Commande ajoutée ou mise à jour avec succès !");
                resetFields();
            } else {
                setMessage("Erreur lors de l'ajout de la commande.");
            }
        });
    };

    const resetFields = () => {
        setQuantity("");
        setSearchTerm("");
        setSelectedArticle(null);
    };

    return (
        <div>
            <div className="container">
                <h2 className="m-2">Faire une nouvelle Commande</h2>
                <form onSubmit={handleSubmit}>
                    <div className="relative w-[30em]">
                        <input
                            type="text"
                            placeholder="Rechercher un article..."
                            className="input input-bordered w-full bg-white mb-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        />
                        {isFocused && searchTerm && (
                            <div className="absolute bg-white w-full max-h-[15em] overflow-y-scroll rounded-box shadow-lg z-10">
                                {filteredArticles.length > 0 ? (
                                    filteredArticles.map((article) => (
                                        <div
                                            className="p-2 hover:bg-cyan-50 cursor-pointer"
                                            key={article.id}
                                            onClick={() => {
                                                setSearchTerm(article.name);
                                                setSelectedArticle(article.idArticle);
                                                setIsFocused(false);
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

                    <label className="my-4 input input-bordered flex bg-white items-center gap-2">
                        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantité" className="grow"/>
                    </label>

                    <button className="mt-4 text-white btn bg-green-700" type="submit" disabled={loading}>
                        {loading ? "Ajout en cours..." : "Ajouter"}
                    </button>
                </form>
                {message && <p className="mt-4 text-red-500">{message}</p>}
            </div>
        </div>
    );
};

export default AddOrderForm;
