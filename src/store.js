import { configureStore } from '@reduxjs/toolkit';
import articlesReducer from './redux/features/articlesSlice';
import ordersReducer from './redux/features/ordersSlice';
import historyReducer from './redux/features/historySlice';
import authReducer from "./redux/features/authSlice";

const store = configureStore({
  reducer: {
    articles: articlesReducer,
    orders: ordersReducer,
    history: historyReducer,
    auth: authReducer,
  },
});

export default store;
