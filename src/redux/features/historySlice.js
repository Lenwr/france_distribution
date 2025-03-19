import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchHistory} from '../services/historyServices';

// Action asynchrone pour récupérer les articles
export const getHistory = createAsyncThunk(
  'history/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchHistory();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


// Slice Redux pour gérer l'état des articles
const articlesSlice = createSlice({
  name: 'history',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Récupération des articles
      .addCase(getHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(getHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default articlesSlice.reducer;
