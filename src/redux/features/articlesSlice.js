import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchArticles, addArticle } from '../services/articlesService';

// Action asynchrone pour récupérer les articles
export const getAllArticles = createAsyncThunk(
  'articles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchArticles();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Action asynchrone pour ajouter un article
export const addNewArticle = createAsyncThunk(
  'articles/add',
  async (article, { rejectWithValue }) => {
    try {
      return await addArticle(article);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Slice Redux pour gérer l'état des articles
const articlesSlice = createSlice({
  name: 'articles',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Récupération des articles
      .addCase(getAllArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(getAllArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addNewArticle.fulfilled, (state, action) => {
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.list.push(action.payload[0]); // ✅ Ajoute l'article retourné
        }
      })
      .addCase(addNewArticle.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default articlesSlice.reducer;
