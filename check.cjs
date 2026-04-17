const fs = require('fs');
const file = 'src/modules/academico/hooks.ts';
let content = fs.readFileSync(file, 'utf-8');
console.log(content.slice(0, 1500));
