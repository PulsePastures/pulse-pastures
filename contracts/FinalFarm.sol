// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FinalNFT is ERC721, Ownable {
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
    constructor() ERC721("SomniaFinal", "SFARM") Ownable() {}
    function mintAnimal(address to, AnimalType _type, uint256 _rate) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        animals[tokenId] = Animal(_type, block.timestamp, _rate, block.timestamp, 1);
        return tokenId;
    }
    function updateLastHarvest(uint256 tokenId) external { animals[tokenId].lastHarvest = block.timestamp; }
    function levelUp(uint256 tokenId) external { animals[tokenId].level++; }
    function getAnimal(uint256 tokenId) external view returns (Animal memory) { return animals[tokenId]; }
}

contract FinalEngine is Ownable {
    FinalNFT public farmNft;
    uint256 public subscriptionId;
    address constant PRECOMPILE = 0x0000000000000000000000000000000000000100;
    
    mapping(address => mapping(uint8 => uint256)) public userInventory;
    mapping(address => uint256[]) public userAnimalIds;
    mapping(address => uint256) public maxSlots;

    event Harvested(address indexed user, uint256 animalId, uint8 animalType, uint256 amount);
    event AnimalBought(address indexed user, uint8 animalType, uint256 tokenId);
    event ReactivityTriggered(address indexed emitter);
    event FarmExpanded(address indexed user, uint256 newMaxSlots);

    constructor(address _nft) Ownable() { farmNft = FinalNFT(_nft); }

    function buyAnimal(uint8 _type) public payable {
        if (userAnimalIds[msg.sender].length == 0 && maxSlots[msg.sender] == 0) maxSlots[msg.sender] = 3;
        require(userAnimalIds[msg.sender].length < maxSlots[msg.sender], "No slot");
        uint256 tokenId = farmNft.mintAnimal(msg.sender, FinalNFT.AnimalType(_type), 3600);
        userAnimalIds[msg.sender].push(tokenId);
        emit AnimalBought(msg.sender, _type, tokenId);
    }

    function expandFarm() public payable {
        maxSlots[msg.sender] += 3;
        emit FarmExpanded(msg.sender, maxSlots[msg.sender]);
    }

    function harvest(uint256 animalId) public {
        require(farmNft.ownerOf(animalId) == msg.sender, "Not yours");
        FinalNFT.Animal memory animal = farmNft.getAnimal(animalId);
        uint256 amount = (block.timestamp - animal.lastHarvest) / animal.productionRate;
        if (amount > 10) amount = 10;
        userInventory[msg.sender][uint8(animal.animalType)] += amount;
        farmNft.updateLastHarvest(animalId);
        emit Harvested(msg.sender, animalId, uint8(animal.animalType), amount);
    }

    function sellProduct(uint8 _type, uint256 _amount) public {
        require(userInventory[msg.sender][_type] >= _amount, "Low stock");
        userInventory[msg.sender][_type] -= _amount;
    }

    function levelUpAnimal(uint256 animalId) public payable {
        require(farmNft.ownerOf(animalId) == msg.sender, "Not yours");
        farmNft.levelUp(animalId);
    }

    function getUserAnimals(address user) public view returns (uint256[] memory) { return userAnimalIds[user]; }

    function withdrawSTT() public onlyOwner { payable(msg.sender).transfer(address(this).balance); }
    function withdrawAmount(uint256 _amount) public onlyOwner { payable(msg.sender).transfer(_amount); }

    function createSubscription() external onlyOwner {
        bytes memory payload = abi.encodeWithSignature(
            "subscribe((bytes32[4],address,address,address,address,bytes4,uint64,uint64,uint64,bool,bool))",
            [bytes32(0), bytes32(0), bytes32(0), bytes32(0)],
            address(0), address(0), address(this), address(this),
            this.onEvent.selector,
            uint64(50000000000), uint64(100000000000), uint64(800000),
            true, false
        );
        (bool success, ) = PRECOMPILE.call(payload);
        require(success, "Sub failed");
    }

    function onEvent(address emitter, bytes32[] calldata, bytes calldata) external {
        emit ReactivityTriggered(emitter);
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == 0x16346399 || interfaceId == 0x01ffc9a7;
    }
    
    receive() external payable {}
}
