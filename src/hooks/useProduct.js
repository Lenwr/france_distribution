import {supabase} from "./useSupabase.js";

export const useProducts = () => {
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

    const deleteProduct = async (id) => {
        const { data, error } = await supabase
            .from('articles')
            .delete()
            .eq('idArticle', id); // Supprime le produit avec l'ID spécifié
        if (error) throw error;
        return data;
    };

    const updateProductPrice = async (idArticle, updatedFields) => {
        const { data, error } = await supabase
            .from('articles')
            .update({'sell_price' : updatedFields}) // Met à jour les champs spécifiés
            .eq('id', idArticle); // Filtre par ID
        if (error) throw error;
        return data;
    };





    return { getProducts, addProduct, getProductById, deleteProduct, updateProductPrice  };
};
