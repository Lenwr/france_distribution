import {supabase} from "./useSupabase.js";

export const useOrdersHistory = () => {
    const getOrdersHistory = async () => {
        const { data, error } = await supabase.from('commandes_historique').select('*');
        if (error) throw error;
        return data;
    };
    return { getOrdersHistory };
};
