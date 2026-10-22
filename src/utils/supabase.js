import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

/** @type {import('@supabase/supabase-js').SupabaseClient<import('@/types/database').Database>} */
export const supabase = createClient(supabaseUrl, supabaseKey)
