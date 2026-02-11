import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Check SUPABASE_URL and SUPABASE_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}
