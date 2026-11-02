import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseAuth } from '../../services/firebaseClient.js';

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try { await signInWithEmailAndPassword(firebaseAuth, credentials.email.trim(), credentials.password); }
  catch (error) {
    const messages = {
      'auth/invalid-credential': 'Email ou mot de passe incorrect. Utilisez un compte créé dans ce projet Firebase.',
      'auth/user-not-found': 'Email ou mot de passe incorrect. Utilisez un compte créé dans ce projet Firebase.',
      'auth/wrong-password': 'Email ou mot de passe incorrect. Utilisez un compte créé dans ce projet Firebase.',
      'auth/invalid-email': 'Vérifiez le format de votre adresse email.',
      'auth/operation-not-allowed': 'La connexion par email et mot de passe est désactivée. Votre administrateur doit l’activer dans Firebase Authentication.',
      'auth/configuration-not-found': 'Firebase Authentication n’est pas encore configuré pour ce projet. Contactez votre administrateur.',
      'auth/invalid-api-key': 'La configuration Firebase de l’application est incorrecte. Contactez votre administrateur.',
      'auth/user-disabled': 'Ce compte est désactivé. Contactez votre administrateur.',
      'auth/too-many-requests': 'Trop de tentatives de connexion. Patientez avant de réessayer.',
      'auth/network-request-failed': 'Impossible de joindre Firebase. Vérifiez votre connexion Internet puis réessayez.',
    };
    return rejectWithValue(messages[error.code] || 'Connexion impossible. Réessayez ou contactez votre administrateur.');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try { await signOut(firebaseAuth); }
  catch { return rejectWithValue('La déconnexion a échoué. Réessayez.'); }
});

const initialState = { user: null, profile: null, role: null, loading: true, error: null };
const authSlice = createSlice({
  name: 'auth', initialState,
  reducers: {
    sessionPending: () => ({ ...initialState }),
    sessionChanged: (_, { payload }) => ({
      user: payload.user, profile: payload.profile, role: payload.profile?.role ?? null, loading: false, error: null,
    }),
    sessionCleared: (_, { payload }) => ({ ...initialState, loading: false, error: payload ?? null }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(logoutUser.fulfilled, () => ({ ...initialState, loading: false }))
      .addCase(logoutUser.rejected, (state, action) => { state.error = action.payload; });
  },
});
export const { sessionPending, sessionChanged, sessionCleared } = authSlice.actions;
export default authSlice.reducer;
