import { deleteArticle, validPrice } from "../services/inventoryService.js";
import {firestore, supabase} from "./useSupabase.js";

export const useProducts = () => {
    const syncPublicPrice = async (idArticle, sellPrice) => {
        const { data: article, error: readError } = await supabase.from('articles').select('*').eq('id', idArticle).single();
        if (readError) throw readError;
        const { error } = await supabase.from('catalogue_public').upsert({ id: idArticle, name: article.name, image: article.image || '', category: article.category || article.suppliers || '', sell_price: sellPrice, available: Number(article.quantity || 0) > 0, code_ref: article.code_ref || '', updated_at: new Date().toISOString() });
        if (error) throw error;
    };
    const getProducts = async () => {
        const { data, error } = await supabase.from('articles').select('*');
        if (error) throw error;
        return data;
    };

    const addProduct = async (product) => {
        const { data, error } = await supabase.from('articles').insert(product);
        if (error) throw error;
        return data;
    };

    const getProductById = async (id) => {
        const { data, error } = await supabase
            .from('articles')
            .select('*')
            .eq('id', id)
            .single(); // Assure qu'on récupère un seul produit
        if (error) throw error;
        return data;
    };

    const deleteProduct = (id) => deleteArticle(firestore, id);

    const updateProductPrice = async (idArticle, updatedFields) => {
        const { data, error } = await supabase
            .from('articles')
            .update({'sell_price' : validPrice(updatedFields)}) // Met à jour les champs spécifiés
            .eq('id', idArticle); // Filtre par ID
        if (error) throw error;
        await syncPublicPrice(idArticle, validPrice(updatedFields));
        return data;
    };
    const updatePurchasePrice = async (idArticle, updatedFields) => {
        const { data, error } = await supabase
            .from('articles')
            .update({'price' : validPrice(updatedFields, true)}) // Met à jour les champs spécifiés
            .eq('id', idArticle); // Filtre par ID
        if (error) throw error;
        return data;
    };





    return { getProducts, addProduct, getProductById, deleteProduct, updateProductPrice ,updatePurchasePrice  };
};
