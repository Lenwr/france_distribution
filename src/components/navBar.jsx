/* eslint-disable */
import React from 'react';
import {useSelector,useDispatch} from "react-redux"
import {supabase} from "../hooks/useSupabase.js";
import {useNavigate} from "react-router-dom";
import { logoutUser } from "../redux/features/authSlice.js";

function NavBar(props) {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = async () => { 
        if (user) {
            await dispatch(logoutUser()); // Déclencher la déconnexion via Redux
            navigate("/login"); // Rediriger après la déconnexion
        }
    };
    return (
        <div>
            <div className="navbar bg-base-100">
                <div className="flex-1">
                    <a className="btn btn-ghost text-white text-xl">France Distribution</a>

                </div>
                <div className="flex-none">
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                            <div className="w-10 rounded-full">
                                <img
                                    alt="Tailwind CSS Navbar component"
                                    src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"/>
                            </div>
                        </div>
                        <ul
                            tabIndex={0}
                            className="menu menu-sm dropdown-content bg-base-100 text-white rounded-box z-[1] mt-3 w-52 p-2 shadow">
                        
                            <li onClick={handleLogout}><a>Se deconnecter</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NavBar;
