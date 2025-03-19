import { supabase } from '../../hooks/useSupabase';

// Récupérer toutes les commandes
export const fetchOrders = async () => {
  const { data, error } = await supabase.from('commandes').select('*');
  if (error) throw error;
  return data;
};

// Ajouter une nouvelle commande
export const addOrders = async (order) => {
  const { data, error } = await supabase.from('commandes').insert(order);
  if (error) throw error;
  return data;
};

