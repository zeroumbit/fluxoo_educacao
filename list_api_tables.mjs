import fs from 'fs';
const dotenv = fs.readFileSync('.env', 'utf-8');
const env = {};
dotenv.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  }
});

const url = env.VITE_SUPABASE_URL + '/rest/v1/rpc/get_tables'; // Doesn't exist, let's use root
fetch(env.VITE_SUPABASE_URL + '/rest/v1/', { headers: { 'apikey': env.VITE_SUPABASE_ANON_KEY, Authorization: 'Bearer ' + env.VITE_SUPABASE_ANON_KEY } })
  .then(res => res.json().then(j => {
    const tableKeys = Object.keys(j.paths).map(k => k.replace('/', ''));
    console.log('API Table Paths:', tableKeys.sort().join(', '));
  }))
  .catch(err => console.error(err));
