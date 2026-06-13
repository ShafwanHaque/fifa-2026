import { createClient } from "@supabase/supabase-js";

// Safe for use in client components — uses the publishable key.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
