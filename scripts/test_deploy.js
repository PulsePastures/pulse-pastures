const hre = require("hardhat");

async function main() {
  console.log("🚀 Testing minimal deployment...");
  const TestDeploy = await hre.ethers.getContractFactory("TestDeploy");
  const test = await TestDeploy.deploy();
  await test.waitForDeployment();
  console.log("✅ Deployed to:", await test.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
