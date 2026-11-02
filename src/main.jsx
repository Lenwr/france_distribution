import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { firebaseConfigurationError } from './services/firebaseClient.js';
import {Provider} from "react-redux";
import store from './store';
import AuthProvider from './auth/AuthProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {firebaseConfigurationError ? <main className="max-w-xl mx-auto p-8 text-black"><h1 className="text-2xl font-bold">Configurer France Distribution</h1><p className="my-4">La connexion Firebase n’est pas encore configurée. Suivez la section « Nouveau projet Firebase » du README, puis redémarrez l’application.</p><p role="status">{firebaseConfigurationError}</p></main> : <Provider store={store}>
    <AuthProvider>
          <App />
      </AuthProvider>
      </Provider>}
  </StrictMode>,
)
