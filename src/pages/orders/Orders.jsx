/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAllOrders } from "../../redux/features/ordersSlice.js";
import { Box, Plus } from "lucide-react";
import ReceiveForm from "./ReceiveForm.jsx";

function Orders() {
    const dispatch = useDispatch();

    // Récupérer les données depuis Redux
    const orders = useSelector((state) => state.orders.list);
    const loading = useSelector((state) => state.orders.loading);
    const error = useSelector((state) => state.orders.error);

    // États locaux pour gérer l'article sélectionné
    const [idArticleSpended, setIdArticleSpended] = useState(null);
    const [idQuantitySpended, setIdQuantitySpended] = useState(null);

    // Charger les commandes au montage du composant
    useEffect(() => {
        dispatch(getAllOrders());
    }, [dispatch]);

    return (
        <div className="h-[38em] p-4  bg-white w-full overflow-x-auto">

            {/* Affichage du chargement */}
            {loading && <p className="text-center text-gray-500">Chargement des commandes...</p>}

            {/* Affichage de l'erreur si nécessaire */}
            {error && <p className="text-center text-red-500">Erreur : {error}</p>}

            {/* Table des commandes */}
            {!loading && !error && (
                <table className="w-full">
                    <thead className="bg-gray-600 border-b">
                        <tr>
                            <th className="text-sm font-medium text-white px-6 py-4 text-left">Commande</th>
                            <th className="text-sm font-medium text-white px-6 py-4 text-left">Quantité</th>
                            <th className="text-sm font-medium text-white px-6 py-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length > 0 ? (
                            orders.map((article) => (
                                <tr key={article.id} className="bg-white cursor-pointer hover:shadow-2xl border-b">
                                    <td className="py-2 w-[65%] text-black px-4">{article.name}</td>
                                    <td className={`flex flex-row py-2 text-black px-4 place-items-center ${article.quantity < 5 ? "text-red-600" : ""}`}>
                                        <Box className="mx-2" size={16} /> {article.quantity}
                                    </td>
                                    <td className="place-items-center">
                                        <span
                                            className="p-2 bg-green-700 text-white rounded cursor-pointer hover:bg-green-800"
                                            onClick={() => {
                                                document.getElementById('my_receptionOrderForm').showModal();
                                                setIdArticleSpended(article.idCommande);
                                                setIdQuantitySpended(article.quantity);
                                            }}
                                        >
                                            Réceptionner
                                        </span>
                                        <Plus size={16} className="hidden text-blue-700 hover:scale-110" />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="text-center py-4 text-gray-500">
                                    Aucune commande disponible.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {/* Modal de réception */}
            <dialog id="my_receptionOrderForm" className="modal">
                <div className="modal-box bg-white text-black">
                    <div className="modal-action flex flex-col bg-white items-end">
                        <ReceiveForm idArticleSpended={idArticleSpended} idQuantitySpended={idQuantitySpended} />
                        <form method="dialog">
                            <button className="btn bg-red-700 text-white hover:bg-red-800">Fermer</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    );
}

export default Orders;
