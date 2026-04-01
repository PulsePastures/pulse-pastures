require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1
      },
      evmVersion: "shanghai"
    }
  },
  networks: {
    baseTestnet: {
      url: "https://sepolia.base.org",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 && process.env.PRIVATE_KEY.startsWith("0x")) ? [process.env.PRIVATE_KEY] : [],
    },
    baseMainnet: {
      url: "https://mainnet.base.org",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 && process.env.PRIVATE_KEY.startsWith("0x")) ? [process.env.PRIVATE_KEY] : [],
    }
  },
};
