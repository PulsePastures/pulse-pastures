const hre = require("hardhat");

async function main() {
  console.log("🚀 Updating FarmEngine for Reactivity Visibility...");

  const farmNftAddress = "0xb2496D2B2aD41538dfed5F8636D5b9a75eB41BFe";
  
  const FarmEngine = await hre.ethers.getContractFactory("FarmEngine");
  const farmEngine = await FarmEngine.deploy(farmNftAddress, {
    gasLimit: 30000000
  });
  await farmEngine.waitForDeployment();
  const farmEngineAddress = await farmEngine.getAddress();
  console.log("✅ New FarmEngine Deployed to:", farmEngineAddress);

  console.log("⚙️ Initializing System Patterns...");
  const initTx = await farmEngine.initializeSystem();
  await initTx.wait();
  console.log("✅ System Initialized.");

  // Transfer NFT ownership to the NEW engine
  const FarmNFT = await hre.ethers.getContractAt("FarmNFT", farmNftAddress);
  console.log("🔐 Transferring FarmNFT ownership to NEW FarmEngine...");
  const tx = await FarmNFT.transferOwnership(farmEngineAddress);
  await tx.wait();
  console.log("✅ Ownership Transferred.");

  console.log("\n--- UPDATE COMPLETE ---");
  console.log("NEW_FARM_ENGINE_ADDRESS:", farmEngineAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
