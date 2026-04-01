const fs = require('fs');
const path = require('path');

const resultsPath = path.resolve(__dirname, 'results.json');
const htmlPath = path.resolve(__dirname, '../deploy_kontrat.html');

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace ABI
const abiRegex = /const abi = \[.*?\];/s;
html = html.replace(abiRegex, `const abi = ${JSON.stringify(results.abi)};`);

// Replace Bytecode
const bytecodeRegex = /const bytecode = "0x.*?";/;
html = html.replace(bytecodeRegex, `const bytecode = "0x${results.bytecode}";`);

fs.writeFileSync(htmlPath, html);
console.log("Successfully patched deploy_kontrat.html with new Bytecode and ABI!");
