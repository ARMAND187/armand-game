import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client — safe to use in both Server Components and Client Components.
 * The anon key has Row Level Security enforced on the server.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------------------------------------------------------------------------
// Type stubs — replace these with generated types from `supabase gen types`
// once your database schema is finalised.
// ---------------------------------------------------------------------------

export interface Profile {
  id: string;               // UUID — matches auth.users.id
  username: string;
  avatar_url: string | null;
  armand_balance: number;   // Persistent wallet balance stored in DB
  created_at: string;
  updated_at: string;
}
