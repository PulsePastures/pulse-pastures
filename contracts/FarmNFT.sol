// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { ISomniaEventHandler } from "@somnia-chain/reactivity-contracts/contracts/interfaces/ISomniaEventHandler.sol";
import { SomniaExtensions } from "@somnia-chain/reactivity-contracts/contracts/interfaces/ISomniaReactivityPrecompile.sol";

contract FarmNFT is ERC721, Ownable, ISomniaEventHandler {
    uint256 private _nextTokenId;

    enum AnimalType { CHICKEN, SHEEP, COW, GOAT, PIG, BEE }

    struct Animal {
        AnimalType animalType;
        uint256 birthTime;
        uint256 productionRate; // seconds per product
        uint256 lastHarvest;
        uint256 level;
    }

    mapping(uint256 => Animal) public animals;

    constructor() ERC721("SomniaFarmAnimal", "SFARM") Ownable() {}

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
        // Only FarmEngine should call this in a real scenario
        animals[tokenId].lastHarvest = block.timestamp;
    }

    function getAnimal(uint256 tokenId) external view returns (Animal memory) {
        return animals[tokenId];
    }

    function upgradeAnimal(uint256 tokenId) external onlyOwner {
        animals[tokenId].level += 1;
        // Reduce production time by 10% per level up to a point
        animals[tokenId].productionRate = (animals[tokenId].productionRate * 90) / 100;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return ERC721.supportsInterface(interfaceId) || interfaceId == type(ISomniaEventHandler).interfaceId;
    }

    /**
     * @dev Somnia Reactivity Handler. 
     */
    function onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) external override {
        require(msg.sender == SomniaExtensions.SOMNIA_REACTIVITY_PRECOMPILE_ADDRESS, "Only precompile");
        _onEvent(emitter, eventTopics, data);
    }

    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal {
        // PulsePastures Reactivity Logic
    }
}
