const hre = require("hardhat");

async function main() {
  const userAddress = "0x17A4cFbF526A12324CE6300eD4862A78FE679676";
  const provider = hre.ethers.provider;
  const nonce = await provider.getTransactionCount(userAddress);
  const balance = await provider.getBalance(userAddress);

  console.log(`💼 Wallet: ${userAddress}`);
  console.log(`🔢 Current Nonce: ${nonce}`);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} STT`);

  const blockNumber = await provider.getBlockNumber();
  console.log(`🔍 Scanning last 100 blocks for txs from ${userAddress}...`);
  
  for (let i = blockNumber; i > blockNumber - 100; i--) {
    const block = await provider.getBlock(i, true);
    if (!block || !block.transactions) continue;
    
    for (const tx of block.transactions) {
      if (tx.from && tx.from.toLowerCase() === userAddress.toLowerCase()) {
        console.log(`TX FOUND | Block: ${i} | Hash: ${tx.hash} | Nonce: ${tx.nonce} | To: ${tx.to || "CONTRACT CREATION"}`);
      }
    }
  }
}

main().catch(console.error);
