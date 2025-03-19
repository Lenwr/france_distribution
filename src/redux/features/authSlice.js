import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../../hooks/useSupabase";

// Action asynchrone pour la connexion
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Récupération du profil après connexion
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      // Stocker les informations dans le localStorage
      const userData = { user: data.user, role: profileData?.role || "user" };
      localStorage.setItem("user", JSON.stringify(userData.user));
      localStorage.setItem("role", userData.role);

      return userData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Action asynchrone pour la déconnexion
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  await supabase.auth.signOut();
  localStorage.removeItem("user");
  localStorage.removeItem("role");
});

// Vérification de la session actuelle
export const checkSession = createAsyncThunk(
  "auth/checkSession",
  async (_, { rejectWithValue }) => {
    try {
      // Vérifier si les données existent dans localStorage
      const storedUser = localStorage.getItem("user");
      const storedRole = localStorage.getItem("role");

      if (storedUser && storedRole) {
        const user = JSON.parse(storedUser);
        
        // Vérifier si le rôle dans la base de données correspond toujours
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData?.role === storedRole) {
          return { user, role: storedRole };
        } else {
          localStorage.removeItem("user");
          localStorage.removeItem("role");
          return null;
        }
      } else {
        // Vérifier directement auprès de Supabase
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) return null;

        // Récupérer les infos du profil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profileError) throw profileError;

        const userData = { user: data.user, role: profileData?.role || "user" };

        // Sauvegarder dans localStorage
        localStorage.setItem("user", JSON.stringify(userData.user));
        localStorage.setItem("role", userData.role);

        return userData;
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// État initial avec récupération de localStorage
const storedUser = localStorage.getItem("user");
const storedRole = localStorage.getItem("role");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  role: storedRole || null,
  loading: false,
  error: null,
};

// Slice Redux
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Connexion
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.role = action.payload.role;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Déconnexion
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.role = null;
      })
      // Vérification de session
      .addCase(checkSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload?.user || null;
        state.role = action.payload?.role || null;
      })
      .addCase(checkSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default authSlice.reducer;
