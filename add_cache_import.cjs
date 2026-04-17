const fs = require('fs');
const file = 'src/modules/academico/hooks.ts';
let content = fs.readFileSync(file, 'utf-8');
content = 'import { cacheEvents } from \"@/lib/cache-events\"\n' + content;
fs.writeFileSync(file, content);
