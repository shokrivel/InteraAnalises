import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Fallback hardcoded para garantir funcionamento mesmo sem env vars no Vercel
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://jmnuxihpovoibvvapjnq.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptbnV4aWhwb3ZvaWJ2dmFwam5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5ODkwNjgsImV4cCI6MjA5MDU2NTA2OH0._sddYRRs_Ejuu7w9469sI7C9ey_R08XsjtOkwytN-Gs';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
