const configuredMode = import.meta.env.VITE_DATA_MODE;
const localMode = configuredMode ? configuredMode !== 'firebase' : !import.meta.env.PROD;
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyALS0RP2ri_h5Z_H839hQYPl6LgQWSSFNk',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'france-distribution-bcfee.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'france-distribution-bcfee',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'france-distribution-bcfee.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '908636595690',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:908636595690:web:b64c7e7b9cf9bc77ecfe93',
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value || value.startsWith("your-"))
  .map(([key]) => key);

export const firebaseConfigurationError = !localMode && missingConfig.length
  ? `Configuration Firebase manquante : ${missingConfig.join(", ")}` : null;
export const firebaseApp = localMode || firebaseConfigurationError ? null : initializeApp(firebaseConfig);
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;
if (firebaseAuth && import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  if (!firebaseConfig.projectId.startsWith('demo-')) throw new Error('Utilisez un projet demo- pour les émulateurs.');
  connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
