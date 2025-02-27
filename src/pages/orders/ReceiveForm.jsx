/* eslint-disable */
import {useState} from "react";
import {useOrders} from "../../hooks/useOrders.js";

; // Assure-toi d'avoir configuré Supabase

const ReceiveForm = (props) => {
    // États locaux pour les champs du formulaire
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [message, setMessage] = useState('');
    const [price , setPrice] = useState('')
    const [loading, setLoading] = useState(true);

    const {receiveOrder} = useOrders();

    // Fonction pour gérer la soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page
        const response = await receiveOrder(props.recipes.idCommande, parseInt(quantity, 10) )
        if (response.success) {
            setMessage('Commande réceptionnée avec succès.');
        } else {

        }
    }


    return (
        <div className="container ">
            <h1 className="mb-4">Receptionner une quantité </h1>
            <form onSubmit={handleSubmit }>
                <div>
                 <h1></h1>
                </div>
                <div >
                    <label className="input input-bordered flex items-center bg-white gap-2">
                        <input type="number"
                               id="price"
                               value={quantity}
                               onChange={(e) => setQuantity(e.target.value)}
                               placeholder="Quantité" className="grow"/>
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
                <button className="mt-4 btn bg-green-700" type="submit">Réceptionner</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default ReceiveForm;
