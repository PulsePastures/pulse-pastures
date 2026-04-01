const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploing contracts with the account:", deployer.address);

  const virtualTokenAddress = "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b"; // Base VIRTUAL Token
  console.log("Using VIRTUAL Token:", virtualTokenAddress);

  const PulsePastures = await hre.ethers.getContractFactory("PulsePastures");
  const pasture = await PulsePastures.deploy(virtualTokenAddress);

  await pasture.deployed();

  console.log("PulsePastures deployed to:", pasture.address);
  console.log("Copy this address and replace FARM_ENGINE_ADDRESS in frontend/page.tsx!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
