const hre = require("hardhat");

async function main() {
  const account = (await hre.ethers.getSigners())[0];
  console.log("Withdrawing with account:", account.address);

  const oldEngineAddress = "0x28cFD2cA01cfF04260f63AD14E104e794E85964d";
  
  const FarmEngine = await hre.ethers.getContractFactory("FarmEngine");
  const oldEngine = FarmEngine.attach(oldEngineAddress);

  console.log("Calling withdrawSTT on old FarmEngine...");
  const tx = await oldEngine.withdrawSTT();
  
  await tx.wait();
  console.log("Withdrawal successful! Tx hash:", tx.hash);

  const newBalance = await hre.ethers.provider.getBalance(account.address);
  console.log("New Account balance:", hre.ethers.formatEther(newBalance), "STT");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
