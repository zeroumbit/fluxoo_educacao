import fs from 'fs';
const dotenv = fs.readFileSync('.env', 'utf-8');
const env = {};
dotenv.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  }
});

const url = env.VITE_SUPABASE_URL + '/rest/v1/alunos?select=id';
const headers = {
  'apikey': env.VITE_SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + env.VITE_SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

const body = JSON.stringify({
  tenant_id: '00000000-0000-0000-0000-000000000000',
  nome_completo: 'Test',
  data_nascimento: '2000-01-01',
  status: 'ativo',
  cep: '12345-678',
  logradouro: 'Rua A',
  numero: '1',
  complemento: 'C',
  bairro: 'Bairro',
  cidade: 'Cidade',
  estado: 'UF',
  patologias: ['asma'],
  medicamentos: ['dorflex'],
  observacoes_saude: 'ob'
});

fetch(url, { method: 'POST', headers, body })
  .then(res => res.json().then(j => console.log('Status:', res.status, 'Response:', JSON.stringify(j, null, 2))))
  .catch(err => console.error(err));
