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

      // Récupération des informations du profil après connexion
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      return { user: data.user, role: profileData?.role || "user" };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Action asynchrone pour la déconnexion
export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  await supabase.auth.signOut();
});

// Vérification de la session actuelle
export const checkSession = createAsyncThunk("auth/checkSession", async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user || null;
});

// Slice Redux
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    role: null,
    loading: false,
    error: null,
  },
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
        state.user = action.payload;
        state.role = action.payload?.user_metadata?.role || "user"; // Récupère le rôle depuis Supabase
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
      .addCase(checkSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.role = action.payload?.user_metadata?.role || "user";
      });
  },
});

export default authSlice.reducer;
