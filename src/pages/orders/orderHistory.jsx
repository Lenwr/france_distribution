/* eslint-disable */
import { Box } from "lucide-react";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getHistory } from "../../redux/features/historySlice";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function OrderHistory() {
    const dispatch = useDispatch();

    // Sélection des données dans Redux
    const orders = useSelector((state) => state.history.list); // Correction : utiliser state.history
    const loading = useSelector((state) => state.history.loading);
    const error = useSelector((state) => state.history.error);

    useEffect(() => {
        dispatch(getHistory());
    }, [dispatch]);

    // Fonction pour formater la date de commande
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return "Date inconnue"; // Sécurité en cas de valeur undefined/null
        const date = new Date(dateTimeString);
        return format(date, "EEEE d MMMM yyyy à HH'h'mm", { locale: fr });
    };

    return (
        <div className="h-[38em] bg-white w-full overflow-x-auto p-4">
          {/* Gestion du chargement */}
            {loading && <p className="text-center text-gray-500">Chargement de l'historique...</p>}

            {/* Gestion des erreurs */}
            {error && <p className="text-center text-red-500">Erreur : {error}</p>}

            {/* Vérification avant l'affichage du tableau */}
            {!loading && !error && orders.length > 0 ? (
                <table className="w-full border-collapse">
                    <thead className="bg-gray-600 border-b">
                        <tr>
                            <th className="text-sm font-medium text-white px-6 py-4 text-left">Commande</th>
                            <th className="text-sm font-medium text-white px-6 py-4 text-left">Quantité</th>
                            <th className="text-sm font-medium text-white px-6 py-4 text-left">Date de commande</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((article) => (
                            <tr key={article.id} className="bg-white cursor-pointer hover:shadow-2xl border-b">
                                <td className="py-2 text-black px-4">{article.name}</td>
                                <td className={`flex flex-row items-center px-4 ${article.quantity < 5 ? "text-red-600" : "text-black"}`}>
                                    <Box className="mx-2" size={16} /> {article.quantity}
                                </td>
                                <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap">
                                    {formatDateTime(article.date_commande)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                !loading && <p className="text-center text-gray-500">Aucune commande enregistrée.</p>
            )}
        </div>
    );
}

export default OrderHistory;
