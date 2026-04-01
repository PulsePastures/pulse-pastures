const hre = require("hardhat");

async function main() {
  const oldContractAddress = "0xc06f17DED41B859Ad0C2eED82795b5D0A2a83563";
  const adminAddress = "0x17A4cFbF526A12324CE6300eD4862A78FE679676";
  
  const FarmEngine = await hre.ethers.getContractAt("FarmEngine", oldContractAddress);
  
  try {
    const owner = await FarmEngine.owner();
    console.log(`Old Contract Owner: ${owner}`);
    const balance = await hre.ethers.provider.getBalance(oldContractAddress);
    console.log(`Old Contract Balance: ${hre.ethers.formatEther(balance)} STT`);
    
    if (owner.toLowerCase() === adminAddress.toLowerCase()) {
      console.log("Admin is the owner. Withdrawing...");
      const tx = await FarmEngine.withdrawAmount(balance);
      await tx.wait();
      console.log("Withdrawal successful!");
    } else {
      console.log("Admin is NOT the owner of the old contract.");
    }
  } catch (error) {
    console.error("Error accessing old contract:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
