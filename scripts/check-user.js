const { ethers } = require("hardhat");

async function main() {
  const farmEngineAddress = "0x39B3861568E72c3F19266155aa89a0b86559e89A";
  const userAddress = "0x17A4cFbF526A12324CE6300eD4862A78FE679676";
  
  const FarmEngine = await ethers.getContractAt([
    "function maxSlots(address user) public view returns (uint256)",
    "function usedSlots(address user) public view returns (uint256)"
  ], farmEngineAddress);

  const max = await FarmEngine.maxSlots(userAddress);
  const used = await FarmEngine.usedSlots(userAddress);

  console.log(`User: ${userAddress}`);
  console.log(`Max Slots: ${max.toString()}`);
  console.log(`Used Slots: ${used.toString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
