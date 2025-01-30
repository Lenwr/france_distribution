/* eslint-disable */
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useProducts } from "../../hooks/useProduct.js";
import {Edit} from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';

function ProductDetails(props) {

    const [article, setArticle] = useState({}); // Null au lieu de {} pour différencier un article non chargé
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [currentOrder, setCurrentOrder] = useState("");
    const {updateProduct} = useProducts();


    useEffect(() => {
        return () => {
            setArticle(props.article)
        };
    }, [props]);

  function handle(){
      if(quantity > article.quantity){
    toast("Veuillez rentrer une valeur valide !!!")
      } else {
          const updateQuantity = article.quantity - quantity ;
          updateProduct(article.id, updateQuantity).then(r => {});
          setQuantity(updateQuantity.toString());
          toast("Article mis à jour !!!")
      }

  }


    return (
        <div className="content text-black ">
            <div className="bg-cyan-50 h-20 w-full flex place-items-center  flex-row ">
                <Edit className="text-blue-700 bg-white rounded-lg mx-2 shadow size-8 p-2 " />
                <h1 className="text-l text-black font-bold">
                    {props.article.name}
                </h1>
            </div>
            <form className=" flex justify-center items-center">
                <div className=" place-items-center">
                    <label className="form-control w-full max-w-xs">
                        <div className="label flex flex-col items-center">
                            <h1 className="text-2xl font-semibold"> Mettre à jour les ventes </h1>
                            <p className="my-2 text-black">Quantité vendue </p>
                            <p className="text-red-600">{quantity > article.quantity ? "Votre quantité est supérieure à la quantité en stock" : ""}</p>
                        </div>
                        <input type="number"
                               onChange={(e) => {
                                   setQuantity(e.target.value)
                               }}
                               placeholder={props.article.quantity}
                               className="input bg-cyan-50 input-bordered w-full max-w-xs"
                               name={quantity}
                        />
                    </label>
                    <ToastContainer/>
                </div>
           </form>

            <div className="flex flex-row justify-around items-center my-2 ">
                <button className="btn bg-green-700 text-white border-0"  onClick={handle}> MAJ </button>
            </div>

        </div>
    );
}

export default ProductDetails;
