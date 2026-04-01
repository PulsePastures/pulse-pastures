const hre = require("hardhat");

async function main() {
  const farmEngineAddress = "0x98F4C21281Bc268d439A667C8A07b94FF9f999e9";
  const precompileAddress = "0x0000000000000000000000000000000000000100";
  
  console.log("🛠️ Manually Registering Reactivity (V2)...");

  const signer = (await hre.ethers.getSigners())[0];
  
  // High-level ABI for subscription
  const abi = [
    "function subscribe((bytes32[4] eventTopics, address origin, address caller, address emitter, address handlerContractAddress, bytes4 handlerFunctionSelector, uint64 priorityFeePerGas, uint64 maxFeePerGas, uint64 gasLimit, bool isGuaranteed, bool isCoalesced)) external returns (uint256)"
  ];

  const precompile = new hre.ethers.Contract(precompileAddress, abi, signer);

  // MANUALLY SPECIFY EVERYTHING TO AVOID RESOLVENAME
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
    handlerFunctionSelector: "0x16346399",
    priorityFeePerGas: 50000000000n, // 50 gwei
    maxFeePerGas: 100000000000n,      // 100 gwei
    gasLimit: 500000n,
    isGuaranteed: true,
    isCoalesced: false
  };

  console.log("Submitting to 0x0100...");
  const tx = await precompile.subscribe(subData, { gasLimit: 2000000n });
  console.log("Transaction sent:", tx.hash);
  const receipt = await tx.wait();
  console.log("✅ Subscription Confirmed in block:", receipt.blockNumber);
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exitCode = 1;
});
