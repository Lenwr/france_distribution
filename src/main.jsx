import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx' 
import {Provider} from "react-redux";
import store from './store';
import AuthProvider from './auth/AuthProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
    <Provider store={store}>
          <App />
      </Provider>
      </AuthProvider>
  </StrictMode>,
)
