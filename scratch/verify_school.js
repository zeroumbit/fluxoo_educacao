import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? 'https://phuyqtdpedfigbfsevte.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required to run this scratch script.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchools() {
  console.log('Logging in as anonymous client...');
  console.log('RLS should block anonymous access to protected school data.');

  const { count, error } = await supabase
    .from('escolas')
    .select('id', { count: 'exact', head: true });

  if (error) {
    console.log('Anonymous schools query blocked or unavailable:', error.code ?? error.message);
    return;
  }

  console.log(`Anonymous visible schools count: ${count ?? 0}`);
}

checkSchools();
