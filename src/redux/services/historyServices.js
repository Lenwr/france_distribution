import { supabase } from '../../hooks/useSupabase';

// Récupérer l'historique
export const fetchHistory = async () => {
  const { data, error } = await supabase.from('commandes_historique').select('*');
  if (error) throw error;
  return data;
};


