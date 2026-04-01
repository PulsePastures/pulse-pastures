import { createPublicClient, http, encodeFunctionData, parseEther } from 'viem';
import { base } from 'viem/chains';

const url = 'https://mainnet.base.org';
const client = createPublicClient({ chain: base, transport: http(url) });

const abi = [
  { name: 'expandFarm', type: 'function', stateMutability: 'nonpayable', inputs: [], outputs: [] }
];

async function main() {
    try {
        const { request, result } = await client.simulateContract({
            address: "0x6701dA4D40dD742d221e3C56d9cFAe75C24c2c7c",
            abi: abi,
            functionName: 'expandFarm',
            account: "0x17A4cFbF526A12324CE6300eD4862A78FE679676",
        });
        console.log("SIMULATION SUCCESS:", result || "No revert!");
    } catch(e) { 
        console.log("SIMULATION ERROR EXACT DETAILS:");
        console.log(e.shortMessage);
        if (e.cause) console.log(e.cause.message);
    }
}
main();
