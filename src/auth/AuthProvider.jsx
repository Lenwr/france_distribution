import { localMode } from '../services/appMode.js';
import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../services/firebaseClient.js';
import { sessionPending, sessionChanged, sessionCleared } from '../redux/features/authSlice.js';

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useSelector((state) => state.auth);

export default function AuthProvider({ children }) {
  const dispatch = useDispatch();
  useEffect(() => {
    if (localMode) {
      dispatch(sessionChanged({ user: { id: 'local', uid: 'local' }, profile: { username: 'Cet appareil', role: 'admin' } }));
      return;
    }
    // Discard the old UI cache: Firebase is the sole source of session identity.
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    let unsubscribeProfile;
    let generation = 0;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      const version = ++generation;
      unsubscribeProfile?.();
      dispatch(sessionPending());
      if (!currentUser) {
        for (const key of Object.keys(sessionStorage)) {
          if (key.startsWith('sale-draft:') || key.startsWith('order-attempt:') || key.startsWith('receipt-attempt:')) sessionStorage.removeItem(key);
        }
        dispatch(sessionCleared());
        return;
      }
      const user = { id: currentUser.uid, uid: currentUser.uid, email: currentUser.email };
      try {
      const [{ firestore }, { doc, onSnapshot }] = await Promise.all([import('../hooks/useSupabase.js'), import('firebase/firestore')]);
      if (version !== generation) return;
      unsubscribeProfile = onSnapshot(doc(firestore, 'profiles', user.id), (snapshot) => {
        if (version !== generation) return;
        dispatch(sessionChanged({ user, profile: snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null }));
      }, () => {
        if (version === generation) dispatch(sessionCleared('Impossible de charger votre profil. Rechargez la page pour réessayer.'));
      });
      } catch { if (version === generation) dispatch(sessionCleared('Impossible de charger votre profil. Rechargez la page.')); }
    }, () => dispatch(sessionCleared('Impossible de vérifier la session.')));
    return () => { generation++; unsubscribeProfile?.(); unsubscribe(); };
  }, [dispatch]);
  return children;
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };
