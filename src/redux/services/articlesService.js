import { supabase } from '../../hooks/useSupabase';

// Récupérer tous les articles depuis Supabase
export const fetchArticles = async () => {
  const { data, error } = await supabase.from('articles').select('*');
  if (error) throw error;
  return data;
};

// Ajouter un nouvel article à Supabase
export const addArticle = async (article) => {
  const { data, error } = await supabase.from('articles').insert(article);
  if (error) throw error;
  return data;
};

// Récupérer un produit via OpenFoodFacts
export const fetchProduct = async (ean) => {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${ean}.json`);
    const result = await response.json();
    return result.status === 1 ? result.product : null;
  } catch (error) {
    console.error("Erreur lors de la récupération :", error);
    throw error;
  }
};

