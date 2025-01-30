/* eslint-disable */

import ProductsList from "./products/ProductsList.jsx";
import caisse from "../assets/caisse.svg"
import Barcode from "../assets/Barcode.svg"

function Dashboard() {
    return (
        <div className="dashboard flex flex-col md:flex-row bg-white">
            <div className="sideBar md:w-[20%] flex flex-col shadow-lg">
                <h1
                    className=" text-black text-center text-2xl m-2 p-3 rounded shadow-lg bg-cyan-50 bg-opacity-30">France
                    Distribution
                </h1>
                <div className="flex flex-col ">
                    <img src={caisse} alt="caisse" className="" />
                    <button className="btn text-white text-2xl mx-2 p-3 border-0 bg-gray-600">
                        Caisse
                    </button>
                </div>
                <div className="flex flex-col ">
                    <img src={Barcode} alt="caisse" className="" />
                    <button className="btn text-white text-2xl m-2 p-3 border-0 bg-gray-600">
                        Scanner un article
                    </button>
                </div>

            </div>
            <div className=" md:w-[80%] p-8 bg-cyan-50 bg-opacity-30 ">
                <ProductsList/>
            </div>
        </div>
    );
}

export default Dashboard;
