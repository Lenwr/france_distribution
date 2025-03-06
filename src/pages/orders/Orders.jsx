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
    const [idArticleSpended, setIdArticleSpended] = useState();
    const [idQuantitySpended, setIdQuantitySpended] = useState();
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
            className="h-[38em] w-full overflow-x-auto">
            <table
                className="w-full">
                {/* Table head */}
                <thead className="bg-gray-600 border-b  ">

                <tr>
                    <th scope="col" className="text-sm font-medium text-white px-6 py-4 text-left">Commande</th>
                    <th scope="col" className="text-sm font-medium text-white px-6 py-4 text-left">quantité</th>
                    <th scope="col" className="text-sm font-medium text-white px-6 py-4 text-left">Actions</th>
                </tr>
                </thead>
                {/* Table body */}
                <tbody className="">
                {commandes.map((article) => (
                    <tr key={article.id}
                        className="bg-white  cursor-pointer hover:shadow-2xl  border-b">
                        <td className="py-2 w-[65%] text-black px-4">{article.name}</td>
                        <td className={article.quantity < 5 ? "flex flex-row place-items-center h-full text-red-600" : "flex flex-row py-2 text-black px-4 place-items-center"}>
                            <Box className="mx-2" size={16}/> {article.quantity}</td>
                        <td  className=" place-items-center ">
                            {   /*   <SquareArrowDown size={16} className="text-green-700 hover:scale-110" onClick={()=>{
                                document.getElementById('my_receptionOrderForm').showModal()
                                setRecipes(article)
                            }}/> */ }
                            <span className=" p-2 bg-green-700 text-white rounded " onClick={()=>{
                                document.getElementById('my_receptionOrderForm').showModal()
                                setIdArticleSpended(article.idCommande)
                                setIdQuantitySpended(article.quantity)
                            }} > Réceptionner</span>
                            <Plus size={16} className="hidden text-blue-700 hover:scale-110"/>
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
                            <ReceiveForm  idArticleSpended = {idArticleSpended} idQuantitySpended={idQuantitySpended}  />
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

