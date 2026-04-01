const { createPublicClient, http, parseAbi } = require('viem');
const { base } = require('viem/chains');

const engineAddress = '0x54af57468fb7dc81e5f2846525fabec52eaff2a2';
const virtualToken = '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b';

const abi = parseAbi([
  'function animalPrices(uint8) view returns (uint256)',
  'function expandPrice() view returns (uint256)',
  'function owner() view returns (address)'
]);

const erc20Abi = parseAbi([
  'function allowance(address,address) view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function symbol() view returns (string)'
]);

const client = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org')
});

async function main() {
  try {
    const owner = await client.readContract({
      address: engineAddress,
      abi: abi,
      functionName: 'owner'
    });
    console.log("FarmEngine Owner:", owner);

    const price = await client.readContract({
      address: engineAddress,
      abi: abi,
      functionName: 'animalPrices',
      args: [0]
    });
    console.log("FarmEngine Chicken Price:", price.toString());

    // Check my allowance (Assuming the user's wallet is Kerim's public address context logic)
    // Wait, kerim's public address was visible somewhere. Let's just check the state variables first.

  } catch (error) {
    console.error("Error reading contract:", error.message);
  }
}

main();
