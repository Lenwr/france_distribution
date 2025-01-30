/* eslint-disable */
import React, {useEffect, useState} from 'react';
import {useOrders} from "../../hooks/useOrders.js";
import {Box, SquareArrowDown, Plus} from "lucide-react";
import AddArticleForm from "../products/addProductForm.jsx";
import ReceiveForm from "./ReceiveForm.jsx";


function Orders() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [commandes, setCommandes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [recipes, setRecipes] = useState();
    const {getOrders} = useOrders();

    const fetchCommandes = async () => {
        try {
            setLoading(true);
            const data = await getOrders(); // Appelle la fonction du hook
            setCommandes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchCommandes();
    }, []);
    return (
        <div
            className=" h-[35em] overflow-x-auto w-full my-3 bg-white rounded-lg shadow-lg ">
            <table
                className="table w-full text-gray-800 bg-white rounded-lg overflow-hidden table-pin-rows table-pin-cols">
                {/* Table head */}
                <thead className="bg-gray-200 text-white ">

                <tr>
                    <th className="py-2 px-4 text-left">Commande</th>
                    <th className="py-2 px-4 text-left">quantité</th>
                    <th className="py-2 px-4 text-left">Statut</th>
                    <th className="py-2 px-4 text-left">Actions</th>
                </tr>
                </thead>
                {/* Table body */}
                <tbody className="">
                {commandes.map((article) => (
                    <tr key={article.id}
                        className="hover:bg-gray-100 hover:shadow-lg cursor-pointer border-gray-400 ">
                        <td className="py-2 px-4">{article.name}</td>
                        <td className={article.quantity < 5 ? "flex flex-row p-4 place-items-center text-red-600" : "flex place-items-center flex-row p-4"}>
                            <Box className="mx-2" size={16}/> {article.quantity}</td>
                        <td className="p-4 text-center text-white">
                            <p className={article.statut === 'En cours' ? " bg-orange-400 rounded justify-center items-center " : "bg-green-700"}>{article.statut}</p>
                        </td>
                        <td className="flex flex-row place-items-center">
                            <SquareArrowDown className="text-green-700 hover:scale-110" onClick={()=>{
                                document.getElementById('my_receptionOrderForm').showModal()
                                setRecipes(article)
                            }}/>
                            <Plus className="text-blue-700 hover:scale-110"/>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>


            <div className="receptionOrderModal">
                {/* Open the modal using document.getElementById('ID').showModal() method */}
                <dialog id="my_receptionOrderForm" className="modal">
                    <div className="modal-box bg-white text-black">

                        <div className="modal-action flex flex-col bg-white items-end ">
                            <ReceiveForm recipes={recipes} />
                            <form method="dialog">
                                {/* if there is a button in form, it will close the modal */}
                                <button className="btn bg-red-700">Fermer</button>
                            </form>
                        </div>
                    </div>
                </dialog>
            </div>
        </div>
    );
}

export default Orders;

