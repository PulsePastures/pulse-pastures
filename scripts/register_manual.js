const hre = require("hardhat");

async function main() {
  const farmEngineAddress = "0x98F4C21281Bc268d439A667C8A07b94FF9f999e9";
  const precompileAddress = "0x0100";
  
  console.log("🛠️ Manually Registering Reactivity Subscription with HIGH FEES...");

  const signer = (await hre.ethers.getSigners())[0];
  const precompile = await hre.ethers.getContractAt("IBaseReactivityPrecompile", "0x0100", signer);

  const subData = {
    eventTopics: [
        hre.ethers.ZeroHash,
        hre.ethers.ZeroHash,
        hre.ethers.ZeroHash,
        hre.ethers.ZeroHash
    ],
    origin: hre.ethers.ZeroAddress,
    caller: hre.ethers.ZeroAddress,
    emitter: farmEngineAddress,
    handlerContractAddress: farmEngineAddress,
    handlerFunctionSelector: "0x16346399", // onEvent(address,bytes32[],bytes)
    priorityFeePerGas: 50000000000n, // 50 gwei! HIGH PRIORITY
    maxFeePerGas: 100000000000n,      // 100 gwei
    gasLimit: 500000,
    isGuaranteed: true,
    isCoalesced: false
  };

  try {
    const tx = await precompile.subscribe(subData, { gasLimit: 50000000 });
    const receipt = await tx.wait();
    console.log("✅ Subscription Successful! ID is in the logs.");
    console.log("Transaction Hash:", tx.hash);
  } catch (error) {
    console.error("❌ Subscription Failed:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
