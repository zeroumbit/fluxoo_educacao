const cp = require('child_process');
const p = cp.spawn('npx.cmd', ['@testsprite/testsprite-mcp'], {
    env: { ...process.env, API_KEY: 'sk-user-YRWboh8jbJTSQ63Y7E9RqekapH5svZisxEmyuNZ8BNs5iBkUgk9hqKBoEVwlukQZDDuL5Nk2i7_nh8NqVa1gSFcHmf0N0XFl5hwy-JxbEUKHEqsO1MYCB2fwmcNsUZqsrkU' },
    stdio: ['pipe', 'pipe', 'inherit']
});
p.stdout.on('data', d => console.log('OUT:', d.toString()));
p.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
        protocolVersion: '2024-11-05',
        capabilities: { roots: { listChanged: true } },
        clientInfo: { name: 'cli', version: '1.0' }
    }
}) + '\n');
setTimeout(() => {
    p.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
    }) + '\n');
}, 1000);
setTimeout(() => p.kill(), 3000);
