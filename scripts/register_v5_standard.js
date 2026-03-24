const hre = require("hardhat");

async function main() {
  const farmEngineAddress = "0x016338acec43720e4444e3c86340ac83567ef7e8";
  const precompileAddress = "0x0000000000000000000000000000000000000100";
  
  const signer = (await hre.ethers.getSigners())[0];
  console.log("💼 Using wallet:", signer.address);

  // V2.0 Standard Selector for onEvent(address,bytes32[],bytes) is 0x53edf33d
  const selector = "0x53edf33d";
  
  const subscriptionData = [
    [hre.ethers.ZeroHash, hre.ethers.ZeroHash, hre.ethers.ZeroHash, hre.ethers.ZeroHash],
    hre.ethers.ZeroAddress,
    hre.ethers.ZeroAddress,
    farmEngineAddress,
    farmEngineAddress,
    selector,
    50000000000,
    100000000000,
    800000,
    true,
    false
  ];

  const abi = ["function subscribe((bytes32[4],address,address,address,address,bytes4,uint64,uint64,uint64,bool,bool) data) external"];
  const precompile = new hre.ethers.Contract(precompileAddress, abi, signer);

  console.log("🛠️ Registering V5 with V2 Standard selector 0x53edf33d...");
  const tx = await precompile.subscribe(subscriptionData, { gasLimit: 2000000 });
  await tx.wait();
  console.log("✅ V5 REGISTRATION SUCCEEDED! 🚀");
}

main().catch(console.error);
