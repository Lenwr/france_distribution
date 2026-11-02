import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Action asynchrone pour récupérer les commandes
export const getAllOrders = createAsyncThunk(
  'orders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { fetchOrders } = await import('../services/ordersServices.js');
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
      const { addOrders } = await import('../services/ordersServices.js');
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
  async ({ idArticle, quantity, operationId }, { rejectWithValue, getState }) => {
    try {
      const [{ firestore }, { addOrUpdateOrder: saveOrder }] = await Promise.all([import('../../hooks/useSupabase.js'), import('../../services/inventoryService.js')]);
      return await saveOrder(firestore, { idArticle, quantity }, operationId, getState().auth.user?.id);
    } catch (error) { return rejectWithValue(error.message); }
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
        state.list.push(...action.payload); // Ajout direct de l'élément reçu
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
