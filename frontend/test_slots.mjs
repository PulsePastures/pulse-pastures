import { createPublicClient, http, formatEther } from 'viem';
import { base } from 'viem/chains';

const url = 'https://mainnet.base.org';
const client = createPublicClient({ chain: base, transport: http(url) });

const abi = [
  { name: 'maxSlots', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] }
];

async function main() {
    const VIRTUAL = "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b";
    const CONTRACT = "0x0A802a16829B62D29711dC4070B30d8659167DeB";
    const USER = "0x17A4cFbF526A12324CE6300eD4862A78FE679676";

    try {
        const slots = await client.readContract({ address: CONTRACT, abi, functionName: 'maxSlots', args: [USER] });
        const bal = await client.readContract({ address: VIRTUAL, abi, functionName: 'balanceOf', args: [CONTRACT] });
        console.log(`Contract VIRTUAL Balance: ${formatEther(bal)}`);
        console.log(`User ${USER} Slots: ${slots}`);
    } catch(e) { console.log(e); }
}
main();
