/* eslint-disable */

import {Box,} from "lucide-react";
import {useCallback, useEffect, useState} from "react";
import {useOrdersHistory} from "../../hooks/useOrdersHistory.js";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function OrderHistory() {
    const {getOrdersHistory} = useOrdersHistory();
    const [error, setError] = useState(null);
    const [ordersHistory , setOrdersHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const fetchOrdersHistory = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getOrdersHistory();
            setOrdersHistory(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [getOrdersHistory]);

    const filteredArticles = ordersHistory
        .filter((article) => article.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    useEffect(() => {
        fetchOrdersHistory();
    }, []);

    const formatDateTime = (dateTimeString) => {
        const date = new Date(dateTimeString)

        return format(date, "EEEE d MMMM yyyy à HH'h' mm", { locale: fr })
    }

    return (
        <div
            className="h-[38em] bg-white w-full overflow-x-auto">
            <table
                className=" w-full  ">
                {/* Table head */}
                <thead className="bg-gray-600 border-b   ">

                <tr>
                    <th scope="col" className="text-sm font-medium text-white px-6 py-4 text-left">commandes
                    </th>
                    <th scope="col"
                        className="text-sm font-medium text-white px-6 py-4 text-left">Quantité
                    </th>
                    <th scope="col" className="text-sm font-medium text-white px-6 py-4 text-left">Date
                        de commande
                    </th>
                </tr>
                </thead>
                {/* Table body */}
                <tbody className="">
                {filteredArticles.map((article) => (
                    <tr key={article.id}
                        className="bg-white cursor-pointer max-h-3 hover:shadow-2xl border-b">
                        <td className="py-2 w-[65%] text-black px-4">{article.name}</td>
                        <td className={article.quantity < 5 ? "flex flex-row place-items-center  text-red-600" : "flex flex-row py-2 px-4 place-items-center"}>
                            <Box className="mx-2" size={16}/> {article.quantity}</td>
                        <td className="text-sm text-gray-900 font-light px-6 py-4 whitespace-nowrap place-items-center">{formatDateTime(article.date_commande)}</td>
                   </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default OrderHistory;
