import { createClient } from '@supabase/supabase-js';
import { createSupabaseTransferFetch } from '@/lib/supabase-transfer-diagnostics';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    fetch: import.meta.env.DEV
      ? createSupabaseTransferFetch()
      : globalThis.fetch.bind(globalThis),
  },
});
