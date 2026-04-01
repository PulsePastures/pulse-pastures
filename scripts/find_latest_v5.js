const hre = require("hardhat");

async function main() {
  const userAddress = "0x17A4cFbF526A12324CE6300eD4862A78FE679676";
  const provider = hre.ethers.provider;
  const latestBlock = await provider.getBlockNumber();
  
  console.log("🕵️ SCANNING for LATEST V5 STANDARDIZED Contracts (Last 50 blocks)...");

  for (let i = latestBlock; i > latestBlock - 50; i--) {
    const block = await provider.getBlock(i, true);
    if (!block || !block.transactions) continue;
    
    for (const tx of block.transactions) {
      if (tx.from && tx.from.toLowerCase() === userAddress.toLowerCase()) {
        const receipt = await provider.getTransactionReceipt(tx.hash);
        if (receipt && receipt.contractAddress) {
          console.log(`✅ FOUND LATEST V5: ${receipt.contractAddress} in block ${i}`);
        }
      }
    }
  }
}

main().catch(console.error);
