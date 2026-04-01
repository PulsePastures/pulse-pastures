// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./FarmNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FarmEngine is Ownable {
    FarmNFT public farmNft;
    uint256 public subscriptionId;
    
    struct Product { string name; uint256 payout; }
    mapping(FarmNFT.AnimalType => uint256) public animalPrices;
    mapping(FarmNFT.AnimalType => uint256) public upgradePrices;
    mapping(FarmNFT.AnimalType => Product) public products;
    mapping(address => mapping(FarmNFT.AnimalType => uint256)) public userInventory;
    mapping(address => uint256[]) public userAnimalIds;

    event Harvested(address indexed user, uint256 animalId, FarmNFT.AnimalType animalType, uint256 amount);
    event Sold(address indexed user, FarmNFT.AnimalType animalType, uint256 amount, uint256 totalPrice);
    event AnimalBought(address indexed user, FarmNFT.AnimalType animalType, uint256 tokenId);
    event ReactivityTriggered(address indexed emitter);

    constructor(address _farmNft) Ownable() {
        farmNft = FarmNFT(_farmNft);
        
        products[FarmNFT.AnimalType.CHICKEN] = Product("Egg", 0.1 ether);
        products[FarmNFT.AnimalType.SHEEP] = Product("Meat", 0.3 ether);
        products[FarmNFT.AnimalType.COW] = Product("Milk", 0.5 ether);
        products[FarmNFT.AnimalType.GOAT] = Product("Cheese", 0.9 ether);
        products[FarmNFT.AnimalType.PIG] = Product("Bacon", 1.3 ether);
        products[FarmNFT.AnimalType.BEE] = Product("Honey", 1.6 ether);

        animalPrices[FarmNFT.AnimalType.CHICKEN] = 1 ether;
        animalPrices[FarmNFT.AnimalType.SHEEP] = 3 ether;
        animalPrices[FarmNFT.AnimalType.COW] = 5 ether;
        animalPrices[FarmNFT.AnimalType.GOAT] = 9 ether;
        animalPrices[FarmNFT.AnimalType.PIG] = 13 ether;
        animalPrices[FarmNFT.AnimalType.BEE] = 16 ether;
    }

    function buyAnimal(FarmNFT.AnimalType _type) public payable {
        require(msg.value >= animalPrices[_type], "Low STT");
        uint256 tokenId = farmNft.mintAnimal(msg.sender, _type, 3600);
        userAnimalIds[msg.sender].push(tokenId);
        emit AnimalBought(msg.sender, _type, tokenId);
    }

    function harvest(uint256 animalId) public {
        require(farmNft.ownerOf(animalId) == msg.sender, "Not yours");
        FarmNFT.Animal memory animal = farmNft.getAnimal(animalId);
        uint256 amount = (block.timestamp - animal.lastHarvest) / animal.productionRate;
        if (amount > 10) amount = 10;
        require(amount > 0, "Wait");
        userInventory[msg.sender][animal.animalType] += amount;
        farmNft.updateLastHarvest(animalId);
        emit Harvested(msg.sender, animalId, animal.animalType, amount);
    }

    function sellProduct(FarmNFT.AnimalType _type, uint256 _amount) public {
        require(userInventory[msg.sender][_type] >= _amount, "Low stock");
        uint256 totalPayout = products[_type].payout * _amount;
        require(address(this).balance >= totalPayout, "Low treasury");
        userInventory[msg.sender][_type] -= _amount;
        payable(msg.sender).transfer(totalPayout);
        emit Sold(msg.sender, _type, _amount, totalPayout);
    }

    function createSubscription() external onlyOwner {
        require(subscriptionId == 0, "Wait");
        bytes memory payload = abi.encodeWithSignature(
            "subscribe((bytes32[4],address,address,address,address,bytes4,uint64,uint64,uint64,bool,bool))",
            [bytes32(0), bytes32(0), bytes32(0), bytes32(0)],
            address(0), address(0), address(this), address(this),
            this.onEvent.selector,
            uint64(50000000000), uint64(100000000000), uint64(500000),
            true, false
        );
        (bool success, bytes memory result) = address(0x0100).call(payload);
        require(success, "Sub failed");
        subscriptionId = abi.decode(result, (uint256));
    }

    function onEvent(address emitter, bytes32[] calldata, bytes calldata) external {
        require(msg.sender == address(0x0100), "0x0100 only");
        emit ReactivityTriggered(emitter);
    }

    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return interfaceId == 0x16346399 || interfaceId == 0x01ffc9a7;
    }

    receive() external payable {}
}
