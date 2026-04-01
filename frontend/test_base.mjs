import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const url = 'https://mainnet.base.org';

async function main() {
        const req = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_call",
                params: [
                    {
                        from: "0x17A4cFbF526A12324CE6300eD4862A78FE679676",
                        to: "0x54af57468fb7dc81e5f2846525fabec52eaff2a2",
                        data: "0xdda177540000000000000000000000000000000000000000000000000000000000000000",
                        value: "0x0"
                    },
                    "latest",
                    {
                        "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b": { "code": "0x600160005260206000f3" },
                        "0xe2accf7251490dbed4a0810d9e5fb6628516d24c": { "code": "0x600160005260206000f3" },
                        "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { "code": "0x600160005260206000f3" }, // USDC
                    }
                ]
            })
        });
        const res = await req.json();
        console.log("ALL OVERRIDE Result:", res.error ? res.error.message : "SUCCESS!");
}
main();
