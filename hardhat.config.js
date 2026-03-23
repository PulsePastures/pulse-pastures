require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    somniaTestnet: {
      url: "https://dream-rpc.somnia.network/",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 && process.env.PRIVATE_KEY.startsWith("0x")) ? [process.env.PRIVATE_KEY] : [],
    },
    somniaMainnet: {
      url: "https://api.infra.mainnet.somnia.network/",
      accounts: (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 && process.env.PRIVATE_KEY.startsWith("0x")) ? [process.env.PRIVATE_KEY] : [],
    }
  },
};
