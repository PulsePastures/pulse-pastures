const hre = require("hardhat");

async function main() {
  const account = (await hre.ethers.getSigners())[0];
  console.log("Funding from account:", account.address);
  
  const balance = await hre.ethers.provider.getBalance(account.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "STT");

  const engineAddress = "0xc06f17DED41B859Ad0C2eED82795b5D0A2a83563";
  
  // Send 100 STT to the engine
  const amount = hre.ethers.parseEther("100.0");
  
  if (balance < amount) {
    console.log("Not enough balance to fund 100 STT.");
    return;
  }

  console.log("Sending 100 STT to FarmEngine...");
  const tx = await account.sendTransaction({
    to: engineAddress,
    value: amount
  });
  
  await tx.wait();
  console.log("Funded successfully! Tx hash:", tx.hash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
