const hre = require("hardhat");

async function main() {
  const [owner] = await hre.ethers.getSigners();
  console.log("Using owner account:", owner.address);

  const farmEngineAddress = "0x98F4C21281Bc268d439A667C8A07b94FF9f999e9"; 
  const FarmEngine = await hre.ethers.getContractAt("FarmEngine", farmEngineAddress);

  console.log("Creating Base Reactivity subscription...");
  const tx = await FarmEngine.createSubscription({ gasLimit: 50000000 });
  await tx.wait();

  const subId = await FarmEngine.subscriptionId();
  console.log("✅ Subscription Created! ID:", subId.toString());
  console.log("Now perform an action (Harvest/Buy) and check the explorer for 0x0100 calls.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
