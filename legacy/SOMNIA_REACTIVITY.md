# Base Reactivity: Teknik Entegrasyon Rehberi (PulsePastures)

Bu döküman, PulsePastures projesinin Base Network üzerindeki native reactivity özelliklerini nasıl kullandığını ve en son DevRel standartlarına (v2.0) uygun en iyi uygulama dökümantasyonudur.

## 1. Ağ Bilgileri (Base Testnet)

Proje şu an aşağıdaki resmi altyapı (infra) uç noktalarını kullanmaktadır:
- **Chain ID**: `50312`
- **RPC (HTTP)**: `https://api.infra.testnet.base.network`
- **RPC (WebSocket)**: `wss://api.infra.testnet.base.network/ws`
- **Explorer**: [BaseScan](https://shannon-explorer.base.network)

## 2. Mimari ve Entegrasyon Modelleri

### 2.1 Off-Chain Reactivity (WebSocket)
Frontend'de `@somnia-chain/reactivity` üzerinden gerçek zamanlı bildirimler alınır.
- **State Bundling**: `ethCalls` kullanılarak olayla birlikte `usedSlots` ve `maxSlots` verileri atomik olarak çekilir.
- **Optimizasyon**: `onlyPushChanges: true` ile gereksiz bildirimler engellenir.

### 2.2 On-Chain Reactivity (Self-Subscribing Contracts)
`FarmEngine.sol` kontratı artık kendi aboneliğini yönetebilir (Self-Subscribing).
- **Precompile**: Kontrat, `0x0100` adresindeki reactivity precompile'ı doğrudan çağırabilir.
- **Handler**: `BaseEventHandler` temel sınıfı kullanılarak güvenli bir şekilde olaylar işlenir.
- **Gereksinim**: Kontrat sahibinin cüzdanında en az **32 STT** bulunmalıdır.

## 3. Gaz ve Ücret Yapılandırması (Kritik)

Base Reactivity'nin sağlıklı çalışması için şu gaz parametreleri "gwei" cinsinden tanımlanmıştır:
- **Priority Fee**: `2 gwei` (Minimum 2,000,000,000 wei)
- **Max Fee**: `10 gwei` (Minimum 10,000,000,000 wei)
- **Gas Limit**: `500,000` (Simple Handler için önerilen)

## 4. Gelişmiş Özellikler: Session Accounts

Yüksek frekanslı oyun işlemleri (Harvest, Buy vb.) için her seferinde cüzdan onayı beklemek yerine `@somnia-chain/viem-session-account` entegrasyonu planlanmıştır. Bu sayede kesintisiz bir oyun deneyimi sunulur.

---
*Bu proje Base DevRel standartlarına göre modernize edilmiştir.*
