// ─── Supabase Client Configuration ──────────────────────────────────────────
// This file configures the Supabase client for the JIH application.
//
// SETUP INSTRUCTIONS:
// 1. Create a Supabase project at https://supabase.com
// 2. Create a .env file in the project root with:
//    VITE_SUPABASE_URL=https://your-project.supabase.co
//    VITE_SUPABASE_ANON_KEY=your-anon-key
// 3. Install the Supabase client: npm install @supabase/supabase-js
// 4. Uncomment the code below
// 5. Run the migration in src/services/migrations/migration_001_problem_evidence.sql
//
// IMPORTANT: Never expose SUPABASE_SERVICE_ROLE_KEY in client-side code.
// The anon key is safe for browser use with RLS enabled.

// import { createClient } from '@supabase/supabase-js';
//
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
//
// if (!supabaseUrl || !supabaseAnonKey) {
//   console.warn(
//     'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
//   );
// }
//
// export const supabase = createClient(
//   supabaseUrl || '',
//   supabaseAnonKey || '',
// );

// Placeholder export until Supabase is configured
export const supabase = null;
