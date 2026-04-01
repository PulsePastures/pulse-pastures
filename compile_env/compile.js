const fs = require('fs');
const solc = require('solc');
const path = require('path');

const contractPath = path.resolve(__dirname, '../contracts/PulsePastures.sol');
const source = fs.readFileSync(contractPath, 'utf8');

function findImports(importPath) {
    let actualPath = importPath;
    if (importPath.startsWith('@openzeppelin/contracts/')) {
        actualPath = path.resolve(__dirname, '../node_modules', importPath);
    }
    if (fs.existsSync(actualPath)) {
        return { contents: fs.readFileSync(actualPath, 'utf8') };
    }
    return { error: 'File not found: ' + actualPath };
}

const input = {
    language: 'Solidity',
    sources: { 'PulsePastures.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['*'] } } }
};

const compiled = solc.compile(JSON.stringify(input), { import: findImports });
const output = JSON.parse(compiled);

if (output.errors) {
    output.errors.forEach(err => console.error(err.formattedMessage));
}

const contract = output.contracts['PulsePastures.sol']['PulsePastures'];

fs.writeFileSync(path.resolve(__dirname, 'results.json'), JSON.stringify({
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object
}));
console.log("Success! Compiled to results.json");
