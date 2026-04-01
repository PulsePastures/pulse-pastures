const hre = require("hardhat");

async function main() {
  const nftFactory = await hre.ethers.getContractFactory("FinalNFT");
  const nft = await nftFactory.deploy();
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log("🚀 FINAL_NFT:", nftAddr);

  const engineFactory = await hre.ethers.getContractFactory("FinalEngine");
  const engine = await engineFactory.deploy(nftAddr);
  await engine.waitForDeployment();
  const engineAddr = await engine.getAddress();
  console.log("🚀 FINAL_ENGINE:", engineAddr);

  console.log("🛠️ Activating Subscription...");
  const tx = await engine.createSubscription({ gasLimit: 2000000 });
  await tx.wait();
  console.log("✅ ALL DONE!");
}

main().catch(console.error);
