# Bladehound Supabase setup

1. Create a Supabase project.
2. Apply `migrations/202609080001_v016_foundation.sql` in the SQL editor.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the GitHub Pages environment/secrets.
4. Keep the service-role key server-side only. Never expose it through a `NEXT_PUBLIC_` variable.

The v0.1.6 browser release keeps local persistence as a fallback. The schema is
ready for the next connection step: Supabase Auth plus server-validated economy
RPCs/Edge Functions. Direct ledger writes are deliberately denied by RLS.
