import fs from 'fs';
const dotenv = fs.readFileSync('.env', 'utf-8');
const env = {};
dotenv.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  }
});

const url = env.VITE_SUPABASE_URL + '/rest/v1/escolas?select=id,razao_social,gestor_user_id';
const headers = { 'apikey': env.VITE_SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + env.VITE_SUPABASE_ANON_KEY };

fetch(url, { headers })
  .then(res => res.json().then(j => console.log('Escolas:', JSON.stringify(j, null, 2))))
  .catch(err => console.error(err));
