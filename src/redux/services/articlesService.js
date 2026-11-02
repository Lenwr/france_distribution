import { createArticle } from '../../services/inventoryService.js';
import { firestore, supabase } from '../../hooks/useSupabase';

// Récupérer tous les articles depuis Supabase
export const fetchArticles = async () => {
  const { data, error } = await supabase.from('articles').select('*');
  if (error) throw error;
  return data;
};

// Ajouter un nouvel article à Supabase
export const addArticle = async (article) => {
  return [await createArticle(firestore, article)];
};

// Récupérer un produit via OpenFoodFacts
export const fetchProduct = async (ean) => {
  const barcode = String(ean).trim();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const foodResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, { signal: controller.signal });
    if (foodResponse.ok) {
      const food = await foodResponse.json();
      if (food.status === 1 && food.product) return {
        product_name: food.product.product_name || food.product.product_name_fr || '',
        brands: food.product.brands || '',
        category: food.product.categories || '',
        image: food.product.image_front_url || '',
        source: 'Open Food Facts',
      };
    }

    const generalUrl = import.meta.env.DEV
      ? `/api/upcitemdb?upc=${encodeURIComponent(barcode)}`
      : `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`;
    const generalResponse = await fetch(generalUrl, { signal: controller.signal });
    if (!generalResponse.ok) throw new Error('Les services de recherche sont indisponibles.');
    const general = await generalResponse.json();
    const item = general.items?.[0];
    return item ? {
      product_name: item.title || '',
      brands: item.brand || '',
      category: item.category || '',
      image: item.images?.[0] || '',
      source: 'UPCitemdb',
    } : null;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('La recherche a pris trop de temps.');
    console.error('Erreur lors de la récupération du produit :', error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

