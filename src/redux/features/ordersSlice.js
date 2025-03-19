import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchOrders, addOrders } from '../services/ordersServices';
import { supabase } from '../../hooks/useSupabase';

// Action asynchrone pour récupérer les commandes
export const getAllOrders = createAsyncThunk(
  'orders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchOrders();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Action asynchrone pour ajouter une commande
export const addNewOrder = createAsyncThunk(
  'orders/add',
  async (order, { rejectWithValue }) => {
    try {
      const response = await addOrders(order);
      return response; // Supposons que la réponse contient directement la commande ajoutée
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


// 🔹 Action pour ajouter ou mettre à jour une commande
export const addOrUpdateOrder = createAsyncThunk(
  'orders/addOrUpdate',
  async ({ idArticle, quantity, name }, { rejectWithValue }) => {
    try {
      // 🔍 Vérifier si la commande existe déjà
      const { data: existingOrder, error: fetchError } = await supabase
        .from('commandes')
        .select('*')
        .eq('idArticle', idArticle)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError; // Ignorer l'erreur si aucune commande trouvée

      let orderData;

      if (existingOrder) {
        // 🔄 Mise à jour de la quantité existante
        const newQuantity = existingOrder.quantity + parseInt(quantity, 10);
        const { data, error: updateError } = await supabase
          .from('commandes')
          .update({ quantity: newQuantity })
          .eq('id', existingOrder.id)
          .select('*')
          .single();

        if (updateError) throw updateError;
        orderData = data;
      } else {
        // 🆕 Création d'une nouvelle commande
        const { data, error: insertError } = await supabase
          .from('commandes')
          .insert([{ idArticle, quantity: parseInt(quantity, 10), name, statut: "En cours" }])
          .select('*')
          .single();

        if (insertError) throw insertError;
        orderData = data;
      }

      // 📌 Ajouter la commande dans `commandes_historique`
      const { error: historyError } = await supabase
        .from('commandes_historique')
        .insert([{ id_commande: orderData.id, id_article: idArticle, quantity: quantity, name, date_commande: new Date() }]);

      if (historyError) throw historyError;

      return orderData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


// Slice Redux pour gérer l'état des commandes
const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {}, // Si nécessaire, tu peux ajouter des reducers classiques ici
  extraReducers: (builder) => {
    builder
      // Récupération des commandes
      .addCase(getAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload; // Mise à jour complète de la liste
      })
      .addCase(getAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Ajout d'une commande
      .addCase(addNewOrder.pending, (state) => {
        state.loading = true; // On active le chargement pour l'ajout
        state.error = null;
      })
      .addCase(addNewOrder.fulfilled, (state, action) => {
        state.loading = false; // On désactive le chargement
        state.list.push(action.payload); // Ajout direct de l'élément reçu
      })
      .addCase(addNewOrder.rejected, (state, action) => {
        state.loading = false; // En cas d'échec, désactivation du chargement
        state.error = action.payload;
      })
      .addCase(addOrUpdateOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(addOrUpdateOrder.fulfilled, (state, action) => {
        state.loading = false;
        const existingIndex = state.list.findIndex(order => order.idArticle === action.payload.idArticle);
        if (existingIndex !== -1) {
          state.list[existingIndex].quantity = action.payload.quantity; // 🔄 Mise à jour directe
        } else {
          state.list.push(action.payload); // 🆕 Ajout d’une nouvelle commande
        }
      })
      .addCase(addOrUpdateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default ordersSlice.reducer;
