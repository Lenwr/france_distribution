/* eslint-disable */
import AddArticleForm from "./addProductForm.jsx";
import {useProducts} from "../../hooks/useProduct.js";
import {useEffect, useState} from "react";
import ProductDetails from "./productDetails.jsx";
import {Box, ReceiptText, CircleX, Trash2, Pencil} from 'lucide-react';
import {Link, useLocation, useNavigate} from "react-router-dom";
import Orders from "../orders/Orders.jsx";
import AddOrderForm from "../orders/AddOrderForm.jsx";
import {toast, ToastContainer} from "react-toastify";


function ProductsList() {
    const {getProducts,deleteProduct} = useProducts(); // Récupère la fonction depuis le hook
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [productDetails, setProductDetails] = useState(null);
    const [tabName, setTabName] = useState("stock");
    const [page, setPage] = useState("Stock");
    const [message, setMessage] = useState("");

    // Fonction pour récupérer les articles via le hook
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
    const handleDelete = async () => {
        deleteProduct(productDetails.idArticle).then((res) => {})
        toast("Votre article à été supprimé")
    };
    const filteredArticles = articles
        .filter((article) =>
            article.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    const styles = {}

    // Utilisation de useEffect pour charger les articles au montage
    useEffect(() => {
        fetchArticles().then(r => {});
    }, []);
    return (

        <div className="products-list flex flex-col items-center bg-cyan-50 bg-opacity-30 min-h-screen  ">

            <div className="addProductModal">
                {/* Open the modal using document.getElementById('ID').showModal() method */}
                <dialog id="my_productForm" className="modal ">
                    <div className="modal-box bg-white">
                        <AddArticleForm/>
                        <div className="modal-action">
                            <form method="dialog">
                                {/* if there is a button in form, it will close the modal */}
                                <button className="btn bg-red-700">Fermer</button>
                            </form>
                        </div>
                    </div>
                </dialog>
            </div>
            <div className="addOrderModal">
                <div className="deleteProductModal">
                    {/* Open the modal using document.getElementById('ID').showModal() method */}
                    <dialog id="my_deleteForm" className="modal">
                        <div className="modal-box bg-white">
                            <p className="text-black">Vous êtes sur le point de supprimer l'article  </p>
                            <ToastContainer position="top-left"/>
                            <div className="modal-action bg-white text-white">
                                <button className="btn bg-red-700 border-0 text-white " onClick={handleDelete}>Oui</button>
                                <form method="dialog">
                                    {/* if there is a button in form, it will close the modal */}
                                    <button className="btn bg-green-700 border-0 text-white ">Fermer</button>
                                </form>
                            </div>
                        </div>
                    </dialog>
                </div>
                {/* Open the modal using document.getElementById('ID').showModal() method */}
                <dialog id="my_orderForm" className="modal">
                    <div className="modal-box bg-white text-black">
                        <AddOrderForm/>
                        <div className="modal-action">
                            <form method="dialog">
                                {/* if there is a button in form, it will close the modal */}
                                <button className="btn bg-red-700">Fermer</button>
                            </form>
                        </div>
                    </div>
                </dialog>
            </div>
            <div className="detailListModal">
                {/* Open the modal using document.getElementById('ID').showModal() method */}
                <dialog id="my_productDetails" className=" bg-white w-[40%] h-[50%]  rounded-lg shadow-2xl ">
                    <div className=" bg-white ">
                        {productDetails ? <ProductDetails article={productDetails}/> : "pas de produis"}
                        <div className="modal-action ">
                            <form method="dialog" >
                                {/* if there is a button in form, it will close the modal */}
                                <button className=" mr-4 btn bg-red-700 border-0 text-white">
                                 Fermer
                                </button>
                            </form>
                        </div>
                    </div>
                </dialog>
            </div>
            <div className="rounded-lg my-2 bg-white w-full p-4 shadow">
                <div className="flex flex-row justify-between">
                    <span className="flex flex-row items-center">
                 <ReceiptText className="text-gray-600"/>
                    <h1 className=" text-gray-600 mx-2 font-bold text-2xl">{page}</h1>
                    </span>
                    {
                        tabName === "stock" ? <button className="btn text-white bg-gray-600 "
                                                      onClick={() => document.getElementById('my_productForm').showModal()}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                     stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                                </svg>
                                Créer un article
                            </button>
                            : <button className="btn text-white bg-gray-600 "
                                      onClick={() => document.getElementById('my_orderForm').showModal()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                     stroke="currentColor" className="size-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                                </svg>
                                Nouvelle Commande </button>


                    }
                </div>

                <div className="flex flex-row  items-center">
                    <label className="input bg-cyan-50 input-bordered flex items-center gap-2 m-2">
                        <input type="text" value={searchTerm}
                               onChange={handleSearchChange} className="grow text-black" placeholder="Rechercher"/>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="h-4 w-4 opacity-70">
                            <path
                                fillRule="evenodd"
                                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                                clipRule="evenodd"/>
                        </svg>
                    </label>
                </div>
            </div>

            {/* Table of products */}
            <div>
                <div role="tablist" className="tabs tabs-bordered ">
                    <a role="tab" className="tab text-black" onClick={() => {
                        setTabName("stock")
                        setPage("Stock")
                    }}>Stock </a>
                    <a role="tab" className="tab text-black " onClick={() => {
                        setTabName("commandes")
                        setPage("Commandes")
                    }}>Commandes</a>
                </div>
            </div>
            {
                tabName === "stock" ?
                    <div
                        className=" h-[35em] overflow-x-auto w-full my-3 bg-white rounded-lg shadow-lg ">
                        <table
                            className="  table table-pin-rows w-full text-gray-800 bg-white rounded-lg ">
                            {/* Table head */}
                            <thead className="bg-gray-200  text-white ">

                            <tr>
                                <th className="py-2 px-4 text-left">Article</th>
                                <th className="py-2 px-4 text-left">Quantité</th>
                                <th className="py-2 px-4 text-left">Prix</th>
                                <th className="py-2 px-4 text-left">Actions</th>
                            </tr>
                            </thead>
                            {/* Table body */}
                            <tbody className="">
                            {filteredArticles.map((article) => (
                                <tr key={article.id}
                                    className="hover:bg-gray-100 hover:shadow-lg cursor-pointer border-gray-400">
                                    <td className="py-2 w-[65%] px-4">{article.name}</td>
                                    <td className={article.quantity < 5 ? "flex flex-row py-2 px-4 justify-center items-center text-red-600" : "flex flex-row py-2 px-4 justify-center items-center"}>
                                        <Box className="mx-2" size={16}/> {article.quantity}</td>
                                    <td className="py-2 px-4">{article.price} €</td>
                                    <td className="py-2 content-center flex flex-row px-4">
                                        <Pencil size={16}
                                                onClick={
                                                    () => {
                                                        const maPromesse = new Promise((resolve, reject) => {
                                                            setProductDetails(article);
                                                            resolve();
                                                        })
                                                        maPromesse
                                                            .then(() => {
                                                                document.getElementById('my_productDetails').showModal()
                                                            })
                                                    }
                                                }
                                                className="text-blue-700 mx-2 rotate-90 hover:rotate-0 duration-500"/>
                                        <Trash2 size={16}
                                                onClick={
                                                    () => {
                                                        const maPromesse = new Promise((resolve, reject) => {
                                                            setProductDetails(article);
                                                            resolve();
                                                        })
                                                        maPromesse
                                                            .then(() => {
                                                                document.getElementById('my_deleteForm').showModal()
                                                            })
                                                    }
                                                }
                                                className="text-red-700"/>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    :
                    <Orders className="w-full  "/>
            }

        </div>
    );
}

export default ProductsList;
