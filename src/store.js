import { combineReducers, configureStore } from '@reduxjs/toolkit';
import articles from './redux/features/articlesSlice';
import orders from './redux/features/ordersSlice';
import history from './redux/features/historySlice';
import auth from './redux/features/authSlice';

const reducer = combineReducers({ articles, orders, history, auth });
export const rootReducer = (state, action) => {
  const clear = ['auth/sessionPending', 'auth/sessionCleared', 'auth/logoutUser/fulfilled'].includes(action.type)
    || (action.type === 'auth/sessionChanged' && (action.payload.profile?.role !== 'admin' || action.payload.user?.id !== state?.auth.user?.id));
  if (clear) state = state ? { auth: state.auth } : undefined;
  // Ignore late business responses after logout or a revoked role.
  if (state && /^(articles|orders|history)\//.test(action.type) && state.auth.role !== 'admin') return state;
  return reducer(state, action);
};
export default configureStore({ reducer: rootReducer });
