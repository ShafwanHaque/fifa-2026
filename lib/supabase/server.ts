import { createClient } from "@supabase/supabase-js";

// Server-only — uses the secret key and must never be imported into client components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
