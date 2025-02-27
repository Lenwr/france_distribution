// signup.js
import {supabase} from "./useSupabase.js";

export const signUp = async (email, password) => {
    const { user, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return user;
};

// login.js
export const signIn = async (email, password) => {
    const { user, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return user;
};

// logout.js
export const signOut = async () => {
    await supabase.auth.signOut();
};
