// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FarmNFT is ERC721, Ownable {
    uint256 private _nextTokenId;
    enum AnimalType { CHICKEN, SHEEP, COW, GOAT, PIG, BEE }
    
    struct Animal {
        AnimalType animalType;
        uint256 birthTime;
        uint256 productionRate;
        uint256 lastHarvest;
        uint256 level;
    }
    mapping(uint256 => Animal) public animals;

    constructor() ERC721("BaseFarmAnimal", "SFARM") Ownable() {}

    function mintAnimal(address to, AnimalType _type, uint256 _rate) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        animals[tokenId] = Animal({
            animalType: _type,
            birthTime: block.timestamp,
            productionRate: _rate,
            lastHarvest: block.timestamp,
            level: 1
        });
        return tokenId;
    }

    function updateLastHarvest(uint256 tokenId) external {
        animals[tokenId].lastHarvest = block.timestamp;
    }

    function getAnimal(uint256 tokenId) external view returns (Animal memory) {
        return animals[tokenId];
    }

    function upgradeAnimal(uint256 tokenId) external onlyOwner {
        animals[tokenId].level += 1;
        animals[tokenId].productionRate = (animals[tokenId].productionRate * 90) / 100;
    }

    // Manual implementation of the handler signature
    function onEvent(address, bytes32[] calldata, bytes calldata) external {
        // Only precompile check (manual)
        require(msg.sender == address(0x0100), "0x0100 only");
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721) returns (bool) {
        return interfaceId == 0x16346399 || super.supportsInterface(interfaceId);
    }
}
