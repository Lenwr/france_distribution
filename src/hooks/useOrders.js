import {supabase} from "./useSupabase.js";

export const useOrders = () => {
    const getOrders = async () => {
        const { data, error } = await supabase.from('commandes').select('*');
        if (error) throw error;
        return data;
    };

    const addOrder = async (commande) => {
        const { data, error } = await supabase.from('commandes').insert(commande);
        if (error) throw error;
        return data;
    };

    const getOrderById = async (id) => {
        const { data, error } = await supabase
            .from('commandes')
            .select('*')
            .eq('id', id)
            .single(); // Assure qu'on récupère un seul produit
        if (error) throw error;
        return data;
    };

    const deleteOrder = async (id) => {
        const { data, error } = await supabase
            .from('commandes')
            .delete()
            .eq('id', id); // Supprime le produit avec l'ID spécifié
        if (error) throw error;
        return data;
    };

    const updateOrder = async (id, updatedFields) => {
        const { data, error } = await supabase
            .from('commandes')
            .update(updatedFields) // Met à jour les champs spécifiés
            .eq('id', id); // Filtre par ID
        if (error) throw error;
        return data;
    };

    return { getOrders, addOrder, getOrderById, deleteOrder, updateOrder };
};
