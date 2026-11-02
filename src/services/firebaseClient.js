const configuredMode = import.meta.env.VITE_DATA_MODE;
const localMode = configuredMode ? configuredMode !== 'firebase' : !import.meta.env.PROD;
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAVsGA7Wq5TzC5aOYlhzjlM4qYk-ZQISAw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'inside-d5e59.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'inside-d5e59',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'inside-d5e59.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '32501856387',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:32501856387:web:a00994316fa5f219e503b6',
};

const missingConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value || value.startsWith("your-"))
  .map(([key]) => key);

export const firebaseConfigurationError = !localMode && missingConfig.length
  ? `Configuration Firebase manquante : ${missingConfig.join(", ")}` : null;
export const firebaseApp = localMode || firebaseConfigurationError ? null : initializeApp(firebaseConfig);
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
if (firebaseAuth && import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  if (!firebaseConfig.projectId.startsWith('demo-')) throw new Error('Utilisez un projet demo- pour les émulateurs.');
  connectAuthEmulator(firebaseAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
