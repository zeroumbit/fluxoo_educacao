const cp = require('child_process');

const API_KEY = 'sk-user-YRWboh8jbJTSQ63Y7E9RqekapH5svZisxEmyuNZ8BNs5iBkUgk9hqKBoEVwlukQZDDuL5Nk2i7_nh8NqVa1gSFcHmf0N0XFl5hwy-JxbEUKHEqsO1MYCB2fwmcNsUZqsrkU';
const PROJECT_PATH = 'E:\\0 SASS\\EDUCACAO';
const PROJECT_NAME = 'EDUCACAO';
const LOCAL_PORT = 5173;

const p = cp.spawn('npx', ['@testsprite/testsprite-mcp'], {
    shell: true,
    env: { ...process.env, API_KEY },
    stdio: ['pipe', 'pipe', 'pipe']
});

let buffer = '';
let msgId = 0;
const pending = {};

p.stderr.on('data', d => {
    // ignore stderr (MCP server logs)
});

p.stdout.on('data', d => {
    buffer += d.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
            const msg = JSON.parse(trimmed);
            if (msg.id !== undefined && pending[msg.id]) {
                pending[msg.id](msg);
            }
        } catch (e) {
            // not JSON
        }
    }
});

function send(method, params) {
    return new Promise((resolve, reject) => {
        const id = ++msgId;
        pending[id] = (msg) => {
            delete pending[id];
            if (msg.error) reject(new Error(JSON.stringify(msg.error)));
            else resolve(msg.result);
        };
        const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
        p.stdin.write(payload);
    });
}

function callTool(name, args) {
    return send('tools/call', { name, arguments: args });
}

async function main() {
    console.log('🔌 Inicializando servidor MCP...');
    await send('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: { roots: { listChanged: true } },
        clientInfo: { name: 'cli-runner', version: '1.0' }
    });
    console.log('✅ Servidor inicializado!\n');

    // PASSO 1: Bootstrap
    console.log('🚀 Passo 1: Bootstrap do projeto...');
    try {
        const bootstrap = await callTool('testsprite_bootstrap', {
            localPort: LOCAL_PORT,
            type: 'frontend',
            projectPath: PROJECT_PATH,
            testScope: 'codebase'
        });
        console.log('✅ Bootstrap concluído:', JSON.stringify(bootstrap, null, 2), '\n');
    } catch (err) {
        console.log('⚠️ Bootstrap falhou (pode já estar inicializado):', err.message, '\n');
    }

    // PASSO 2: Resumo do código
    console.log('📋 Passo 2: Gerando resumo do código...');
    try {
        const summary = await callTool('testsprite_generate_code_summary', {
            projectRootPath: PROJECT_PATH
        });
        console.log('✅ Resumo do código:', JSON.stringify(summary, null, 2), '\n');
    } catch (err) {
        console.log('⚠️ Falha no resumo do código:', err.message, '\n');
    }

    // PASSO 3: PRD
    console.log('📄 Passo 3: Gerando PRD...');
    try {
        const prd = await callTool('testsprite_generate_standardized_prd', {
            projectPath: PROJECT_PATH
        });
        console.log('✅ PRD gerado:', JSON.stringify(prd, null, 2), '\n');
    } catch (err) {
        console.log('⚠️ Falha no PRD:', err.message, '\n');
    }

    // PASSO 4: Plano de testes frontend
    console.log('🗺️ Passo 4: Gerando plano de testes frontend...');
    try {
        const plan = await callTool('testsprite_generate_frontend_test_plan', {
            projectPath: PROJECT_PATH,
            needLogin: true
        });
        console.log('✅ Plano de testes:', JSON.stringify(plan, null, 2), '\n');
    } catch (err) {
        console.log('⚠️ Falha no plano de testes:', err.message, '\n');
    }

    // PASSO 5: Gerar e executar testes
    console.log('🧪 Passo 5: Gerando e executando todos os testes...');
    try {
        const result = await callTool('testsprite_generate_code_and_execute', {
            projectName: PROJECT_NAME,
            projectPath: PROJECT_PATH,
            testIds: [],
            additionalInstruction: '',
            serverMode: 'development'
        });
        console.log('✅ Testes executados!');
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.log('❌ Falha na execução dos testes:', err.message);
    }

    p.kill();
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Erro fatal:', err);
    p.kill();
    process.exit(1);
});
