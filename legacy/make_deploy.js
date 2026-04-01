const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./artifacts/contracts/PulsePastures.sol/PulsePastures.json'));

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DEPLOY PULSE PASTURES</title>
    <script src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"></script>
    <style>
        body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white; margin: 0; }
        .box { background: #1e293b; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 500px; }
        h1 { margin-top: 0; font-size: 24px; }
        p { color: #94a3b8; line-height: 1.5; }
        button { background: #3b82f6; color: white; border: none; padding: 16px 32px; font-size: 18px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 20px; transition: background 0.2s; }
        button:hover { background: #2563eb; }
        button:disabled { background: #475569; cursor: not-allowed; }
        #status { margin-top: 20px; font-family: monospace; color: #10b981; word-break: break-all; }
    </style>
</head>
<body>
    <div class="box">
        <h1>PulsePastures Yükleyici</h1>
        <p>Aşağıdaki butona tıkladığınızda MetaMask açılacak ve yeni (hatasız) kontratınız Base ağına yüklenecektir.</p>
        <button id="deployBtn" onclick="deploy()">🚀 MetaMask İle Yükle (Deploy)</button>
        <div id="status"></div>
    </div>

    <script>
        const abi = ${JSON.stringify(data.abi)};
        const bytecode = "${data.bytecode}";
        const virtualToken = "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b";

        async function deploy() {
            const btn = document.getElementById('deployBtn');
            const status = document.getElementById('status');
            
            if (typeof window.ethereum === 'undefined') {
                status.innerText = 'Lütfen MetaMask yükleyin!';
                return;
            }

            try {
                btn.disabled = true;
                btn.innerText = 'MetaMask Onayı Bekleniyor...';
                
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                
                status.innerText = 'Yükleniyor, lütfen bekleyin...';
                
                const factory = new ethers.ContractFactory(abi, bytecode, signer);
                const contract = await factory.deploy(virtualToken);
                
                btn.innerText = 'Ağa Gönderildi...';
                await contract.deployTransaction.wait();

                status.innerHTML = "✅ BAŞARILI!<br><br>YENİ KONTRAT ADRESİNİZ:<br><b>" + contract.address + "</b><br><br>Bu adresi kopyalayıp frontend/app/page.tsx içindeki FARM_ENGINE_ADDRESS kısmına yapıştırın!";
                btn.style.display = 'none';

            } catch (error) {
                console.error(error);
                status.innerText = "❌ HATA: " + (error.message || 'Bilinmeyen Hata');
                btn.disabled = false;
                btn.innerText = '🚀 Tekrar Dene';
            }
        }
    </script>
</body>
</html>
`;

fs.writeFileSync('./deploy_kontrat.html', html);
console.log("HTML created");
