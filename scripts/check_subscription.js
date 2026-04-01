const hre = require("hardhat");

async function main() {
  const farmEngineAddress = "0x98F4C21281Bc268d439A667C8A07b94FF9f999e9";
  const FarmEngine = await hre.ethers.getContractAt("FarmEngine", farmEngineAddress);
  
  const subId = await FarmEngine.subscriptionId();
  console.log(`Current Subscription ID: ${subId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
