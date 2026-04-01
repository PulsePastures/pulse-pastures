const hre = require("hardhat");

async function main() {
  const address = "0x17A4cFbF526A12324CE6300eD4862A78FE679676";
  const balance = await hre.ethers.provider.getBalance(address);
  console.log(`Balance of ${address}: ${hre.ethers.formatEther(balance)} STT`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
