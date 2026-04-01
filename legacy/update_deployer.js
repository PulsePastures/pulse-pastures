const fs = require('fs');
const abi = fs.readFileSync('/tmp/abi_compact.json', 'utf8').trim();
const bytecode = fs.readFileSync('/tmp/bytecode.txt', 'utf8').trim();
let html = fs.readFileSync('/Users/kerimakay/.gemini/antigravity/scratch/pulse-pastures/deploy_kontrat.html', 'utf8');

html = html.replace(/const abi = \[.*?\];/s, `const abi = ${abi};`);
html = html.replace(/const bytecode = ".*?";/s, `const bytecode = "${bytecode}";`);

fs.writeFileSync('/Users/kerimakay/.gemini/antigravity/scratch/pulse-pastures/deploy_kontrat.html', html);
console.log('Successfully updated deploy_kontrat.html');
