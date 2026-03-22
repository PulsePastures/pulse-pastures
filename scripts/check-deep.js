const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
    const userAddress = "0x17A4cFbF526A12324CE6300eD4862A78FE679676";
    const engineAddress = "0x39B3861568E72c3F19266155aa89a0b86559e89A";
    const nftAddress = "0xF62250a216109C134DB6BaaC4D2fCb0870Ec06D2";

    const engineAbi = [
        "function getUserAnimals(address user) view returns (uint256[])",
        "function maxSlots(address user) view returns (uint256)"
    ];
    const nftAbi = [
        "function getAnimal(uint256 tokenId) view returns (tuple(uint8 animalType, uint256 birthTime, uint256 productionRate, uint256 lastHarvest))",
        "function ownerOf(uint256 tokenId) view returns (address)"
    ];

    const engine = new ethers.Contract(engineAddress, engineAbi, provider);
    const nft = new ethers.Contract(nftAddress, nftAbi, provider);

    console.log(`Checking state for ${userAddress}...`);
    
    try {
        const slots = await engine.maxSlots(userAddress);
        console.log(`Max Slots: ${slots}`);

        const ids = await engine.getUserAnimals(userAddress);
        console.log(`Animal IDs: ${ids.join(", ")}`);

        for (const id of ids) {
            try {
                const owner = await nft.ownerOf(id);
                const data = await nft.getAnimal(id);
                console.log(`ID ${id}: Owner=${owner}, Type=${data.animalType}, Success=TRUE`);
            } catch (e) {
                console.log(`ID ${id}: FAILED TO READ ON NFT CONTRACT. Error: ${e.message.slice(0, 50)}...`);
            }
        }
    } catch (e) {
        console.error("Critical Error:", e);
    }
}

main();
