const hre = require("hardhat");

async function main() {
  console.log("🚀 PulsePastures Deployment Started (NATIVE STT MODE)...");

  // 1. Deploy FarmNFT
  const FarmNFT = await hre.ethers.getContractFactory("FarmNFT");
  const farmNft = await FarmNFT.deploy();
  await farmNft.waitForDeployment();
  const farmNftAddress = await farmNft.getAddress();
  console.log("✅ FarmNFT Deployed to:", farmNftAddress);

  // 2. Deploy FarmEngine
  const FarmEngine = await hre.ethers.getContractFactory("FarmEngine");
  const farmEngine = await FarmEngine.deploy(farmNftAddress);
  await farmEngine.waitForDeployment();
  const farmEngineAddress = await farmEngine.getAddress();
  console.log("✅ FarmEngine Deployed to:", farmEngineAddress);

  // 3. CRITICAL: Transfer FarmNFT ownership to FarmEngine
  // This allows FarmEngine to call mintAnimal
  console.log("🔐 Transferring FarmNFT ownership to FarmEngine...");
  const tx = await farmNft.transferOwnership(farmEngineAddress);
  await tx.wait();
  console.log("✅ Ownership Transferred.");

  console.log("\n--- DEPLOYMENT COMPLETE ---");
  console.log("Please update FARM_ENGINE_ADDRESS in frontend/app/page.tsx with:", farmEngineAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
