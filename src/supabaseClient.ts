// src/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

// Pegando variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("⚠️ Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão configuradas!");
}

// Criando instância do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
