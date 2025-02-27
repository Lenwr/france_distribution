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

    const receiveOrder = async (commandeId, quantityReceived ) => {
        try {
            // Récupérer la commande
            const { data: commande, error: commandeError } = await supabase
                .from('commandes')
                .select('*')
                .eq('idCommande', commandeId)
                .single();

            if (commandeError) throw commandeError;

            const { idArticle, quantity: commandeQuantity } = commande;
            if (quantityReceived > commandeQuantity) {
                throw new Error("La quantité réceptionnée dépasse la quantité de la commande.");
            }
            // Récupérer l'article pour obtenir la quantité actuelle
            const { data: article, error: articleError } = await supabase
                .from('articles')
                .select('*')
                .eq('idArticle', idArticle)
                .single();
            if (articleError) throw articleError;

            const updatedQuantity = article.quantity + quantityReceived;

            const { error: updateArticleError } = await supabase
                .from('articles')
                .update({
                    quantity: updatedQuantity,
                })
                .eq('idArticle', idArticle);

            if (updateArticleError) throw updateArticleError;

            const newCommandeQuantity = commandeQuantity - quantityReceived;

            if (newCommandeQuantity === 0) {
                // Supprimer la commande si la quantité restante est 0
                const { error: deleteError } = await supabase
                    .from('commandes')
                    .delete()
                    .eq('idCommande', commandeId);

                if (deleteError) throw deleteError;
            } else {
                // Mettre à jour la commande avec la nouvelle quantité
                const { error: updateCommandeError } = await supabase
                    .from('commandes')
                    .update({ quantity: newCommandeQuantity })
                    .eq('idCommande', commandeId);

                if (updateCommandeError) throw updateCommandeError;
            }

            return { success: true };
        } catch (error) {
            console.error("Erreur lors de la réception de la commande :", error.message);
            return { success: false, message: error.message };
        }
    };


    return { getOrders, addOrder, getOrderById, deleteOrder, updateOrder , receiveOrder };
};
