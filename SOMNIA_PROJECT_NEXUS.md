# 🪐 SOMNIA PROJECT NEXUS (PulsePastures)

Bu dosya, PulsePastures projesinin Somnia Network entegrasyonu ve genel mimarisi için "ana hafıza" (source of truth) dosyasıdır. "SOMNIA" dendiğinde bu dosya referans alınmalıdır.

## 🚜 Oyunun Ruhu (The Vision)
- **Tür**: High-Stakes Decentralized Farming RPG.
- **Ekonomi**: 10% ROI başı hasat, gerçek zamanlı Merchant Terminal likidasyonu.
- **Estetik**: Brutalist, premium, HUD odaklı tasarım.

## 📡 Somnia Network Yapılandırması
- **Testnet RPC**: `https://dream-rpc.somnia.network/`
- **Mainnet RPC**: `https://api.infra.mainnet.somnia.network/`
- **Reactivity WSS**: `wss://dream-rpc.somnia.network/ws` (Resmi Somnia Dream)
- **Chain IDs**: Testnet (50312), Mainnet (50313 - planlanan)

## 🛡️ Akıllı Kontratlar (Smart Contracts)
- **FarmEngine.sol** (`0xD313Cc9526A966131ecaa9a7A70B648542ac2D96`)
- **FarmNFT.sol** (`0x9f6f2157b00B006268e68536AC5D8C7B7398f8C9`)
- **Reactivity**: `ISomniaEventHandler` arayüzü ve `onEvent` fonksiyonları entegre edildi. 
- **Solidity**: v0.8.30 (optimizer: 200 runs).

## 💻 Frontend & SDK
- **Kütüphane**: `@somnia-chain/streams` (SDK)
- **Hook**: `useSomniaReactivity.ts` (Farming odaklı olay dinleyici).
- **Events**: `Harvested`, `Sold`, `FarmExpanded`, `AnimalBought`.

## 📂 Repo Bilgileri
- **GitHub**: `https://github.com/PulsePastures/pulse-pastures`
- **Branch**: `main`
