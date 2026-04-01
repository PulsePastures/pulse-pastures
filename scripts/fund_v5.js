const hre = require("hardhat");

async function main() {
  const newEngineAddress = "0x016338acec43720e4444e3c86340ac83567ef7e8";
  
  const signer = (await hre.ethers.getSigners())[0];
  console.log("💼 Using wallet:", signer.address);

  console.log("🚚 Funding NEW V5 standardized contract...");
  try {
    const checksummedAddress = hre.ethers.getAddress(newEngineAddress);
    const tx = await signer.sendTransaction({
      to: checksummedAddress,
      value: hre.ethers.parseEther("50"),
      gasLimit: 100000
    });
    await tx.wait();
    console.log("✅ V5 FUNDING SUCCEEDED! 🚀");
  } catch (e) {
    console.error("❌ Funding failed!", e.message);
  }
}

main().catch(console.error);
