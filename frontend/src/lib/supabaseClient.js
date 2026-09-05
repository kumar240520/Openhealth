import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://umclynjzdybfvvpdjqwv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtY2x5bmp6ZHliZnZ2cGRqcXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMjY1NjAsImV4cCI6MjEwMzkwMjU2MH0.Rjm6QlfqNdLmVpXOYZk89ZbTSKq3C9qMkZvLtNII3q4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
