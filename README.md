# 🚜 PulsePastures: The Cyber-Farming Revolution on Base

![PulsePastures Logo](frontend/public/farm-logo.png)

PulsePastures is a high-stakes, hyper-reactive "cyber-farming" simulation deployed on the **Base Mainnet**. Players manage a digital ecosystem of animals, leveraging the speed and security of the Base network to earn, trade, and evolve in a dynamic on-chain economy.

## 🌐 Network Information

- **Network**: [Base Mainnet](https://base.org)
- **Primary Currency**: [VIRTUAL Token](https://basescan.org/token/0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b)

## 📜 Smart Contracts

| Contract | Address |
| :--- | :--- |
| **PulsePastures Engine** | [`0xd5DD3166559Eae73d2886725049dcbBECd98A972`](https://basescan.org/address/0xd5DD3166559Eae73d2886725049dcbBECd98A972) |

## 🎮 Gameplay Mechanics

- **Identity Terminal**: Register your unique on-chain alias to manage your farm.
- **Dynamic Yields**: Animals generate value based on real-time on-chain triggers.
- **VIRTUAL Economy**: Every action on the farm is backed by the VIRTUAL token, ensuring a robust and liquid ecosystem.
- **Visual Farm**: A high-contrast, "Cyber-Chunky" UI designed for maximum clarity and impact.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15+, TailwindCSS, Framer Motion
- **Web3**: Wagmi, Viem, RainbowKit
- **Smart Contracts**: Solidity 0.8.x, Hardhat
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Web3 Wallet (Coinbase Wallet, Metamask, etc.) with VIRTUAL tokens on Base.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PulsePastures/pulse-pastures.git
   cd pulse-pastures
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Contract Analysis (Optional)**:
   ```bash
   # From root directory
   npm install
   npx hardhat compile
   ```

## 🛡️ Security

This project follows strict security standards. Private keys and sensitive API information are strictly managed via environment variables and never committed to the repository.

---

Built with 💚 by the PulsePastures Team on Base.
