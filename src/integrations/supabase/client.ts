import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wqctymbzyuggktplxlgc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxY3R5bWJ6eXVnZ2t0cGx4bGdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODQ1MjEsImV4cCI6MjA4NTk2MDUyMX0.ndo1_Ea-xgtb5jHlfCHmOYrE2UdTfGTAje6khynE384';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
