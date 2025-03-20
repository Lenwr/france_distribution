/* eslint-disable */
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { checkSession } from "./redux/features/authSlice"; // Vérifie la session
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/sales/sales";
import Account from "./pages/profile/Account";
import Login from "./auth/Login";
import AuthRoute from "./routes/AuthRoute";
import NotFound from './components/notFound'; // Importez le composant NotFound

import AdminRoute from "./routes/AdminRoute";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkSession()); // Vérifie la session au chargement de l'appli
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={
        <AuthRoute>
            <Dashboard />
       </AuthRoute>
        }/>
        
        <Route path="/sales" element={
          <AuthRoute>
            <Sales />
          </AuthRoute>
        }/>
        
        <Route path="/profile" element={<Account />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} /> {/* Utilisez le composant NotFound */}
      </Routes>
    </Router>
  );
}

export default App;

