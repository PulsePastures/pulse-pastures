const hre = require("hardhat");

async function main() {
  const OLD_CONTRACT = "0x8CD2988eecf988b0A47c7DB0B61AA8B6ce5e9fB7";
  console.log("🛠️ Starting Asset Recovery from Protocol v1.0:", OLD_CONTRACT);

  // Load the OLD contract using the same ABI (it has withdrawSTT)
  const FarmEngine = await hre.ethers.getContractAt("FarmEngine", OLD_CONTRACT);

  console.log("💰 Executing withdrawSTT() to pull funds back to your wallet...");
  const tx = await FarmEngine.withdrawSTT();
  console.log("⏳ Waiting for confirmation...");
  await tx.wait();

  console.log("✅ Recovery SUCCESSFUL! The STT should now be in your wallet.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
