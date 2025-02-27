import { createClient } from "@supabase/supabase-js";

// Configurez votre instance Supabase
const supabaseUrl = "https://zbotejwkzxwfquqakoes.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpib3Rlandrenh3ZnF1cWFrb2VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NjExNjcsImV4cCI6MjA1MjMzNzE2N30.7UP8kT4WllTI2HldNB1U2LY58bu7ssqQ5TNA4_ec0LU";
export const supabase = createClient(supabaseUrl, supabaseKey);


