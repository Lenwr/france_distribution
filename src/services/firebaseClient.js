const localMode = import.meta.env.VITE_DATA_MODE !== 'firebase';
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
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
