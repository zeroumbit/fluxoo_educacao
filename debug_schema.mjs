import fs from 'fs';
const dotenv = fs.readFileSync('.env', 'utf-8');
const env = {};
dotenv.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  }
});

const url = env.VITE_SUPABASE_URL + '/rest/v1/rpc/check_schema';
const headers = { 'apikey': env.VITE_SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };

// We don't have this RPC. Let's try more direct way.
// Querying PostgREST's root usually gives the schema definition.
fetch(env.VITE_SUPABASE_URL + '/rest/v1/', { headers })
  .then(res => res.json().then(j => console.log('Full API definition:', JSON.stringify(j, null, 2).substring(0, 1000))))
  .catch(err => console.error(err));
