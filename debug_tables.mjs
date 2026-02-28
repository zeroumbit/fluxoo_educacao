import fs from 'fs';
const dotenv = fs.readFileSync('.env', 'utf-8');
const env = {};
dotenv.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  }
});

const url = env.VITE_SUPABASE_URL + '/rest/v1/';
const headers = {
  'apikey': env.VITE_SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + env.VITE_SUPABASE_ANON_KEY
};

fetch(url, { headers })
  .then(res => res.json().then(j => {
    console.log('Tabelas disponíveis via API:');
    if (j.definitions) {
        console.log(Object.keys(j.definitions).join(', '));
    } else if (Array.isArray(j)) {
        // Some versions of PostgREST return an array of paths or similar
        console.log(JSON.stringify(j, null, 2));
    } else {
        console.log('Resposta inesperada:', j);
    }
  }))
  .catch(err => console.error(err));
