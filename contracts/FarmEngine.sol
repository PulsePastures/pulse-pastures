// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./FarmNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { ISomniaEventHandler } from "@somnia-chain/reactivity-contracts/contracts/interfaces/ISomniaEventHandler.sol";
import { SomniaExtensions } from "@somnia-chain/reactivity-contracts/contracts/interfaces/ISomniaReactivityPrecompile.sol";

contract FarmEngine is Ownable, ISomniaEventHandler {
    FarmNFT public farmNft;
    address public treasury = 0x17A4cFbF526A12324CE6300eD4862A78FE679676;

    struct Product {
        string name;
        uint256 payout; // in wei
    }

    mapping(FarmNFT.AnimalType => uint256) public animalPrices;
    mapping(FarmNFT.AnimalType => uint256) public upgradePrices;
    mapping(FarmNFT.AnimalType => Product) public products;
    mapping(address => mapping(FarmNFT.AnimalType => uint256)) public userInventory;
    mapping(address => uint256[]) public userAnimalIds;

    event Harvested(address indexed user, uint256 animalId, FarmNFT.AnimalType animalType, uint256 amount);
    event Sold(address indexed user, FarmNFT.AnimalType animalType, uint256 amount, uint256 totalPrice);

    mapping(address => uint256) public maxSlots;
    mapping(address => uint256) public usedSlots;

    event FarmExpanded(address indexed user, uint256 newMaxSlots);

    uint256 public totalAnimalsCount;

    constructor(address _farmNft) Ownable() {
        farmNft = FarmNFT(_farmNft);

        // Protocol v2.0 ROI Payouts (0.5 - 8.0 STT) - REDUCED BY 80%
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

        upgradePrices[FarmNFT.AnimalType.CHICKEN] = 0.2 ether;
        upgradePrices[FarmNFT.AnimalType.SHEEP] = 0.6 ether;
        upgradePrices[FarmNFT.AnimalType.COW] = 1 ether;
        upgradePrices[FarmNFT.AnimalType.GOAT] = 1.8 ether;
        upgradePrices[FarmNFT.AnimalType.PIG] = 2.6 ether;
        upgradePrices[FarmNFT.AnimalType.BEE] = 3.2 ether;
    }

    function setAnimalPrice(FarmNFT.AnimalType _type, uint256 _price) external onlyOwner {
        animalPrices[_type] = _price;
    }

    function setUpgradePrice(FarmNFT.AnimalType _type, uint256 _price) external onlyOwner {
        upgradePrices[_type] = _price;
    }

    function setProductPayout(FarmNFT.AnimalType _type, uint256 _payout) external onlyOwner {
        products[_type].payout = _payout;
    }

    function buyAnimal(FarmNFT.AnimalType _type) public payable {
        if (maxSlots[msg.sender] == 0) maxSlots[msg.sender] = 1; 
        require(usedSlots[msg.sender] < maxSlots[msg.sender], "Farm is full!");

        uint256 price = animalPrices[_type];
        uint256 rate = 0;

        if (_type == FarmNFT.AnimalType.CHICKEN) { rate = 3600; }
        else if (_type == FarmNFT.AnimalType.SHEEP) { rate = 10800; }
        else if (_type == FarmNFT.AnimalType.COW) { rate = 18000; }
        else if (_type == FarmNFT.AnimalType.GOAT) { rate = 32400; }
        else if (_type == FarmNFT.AnimalType.PIG) { rate = 46800; }
        else if (_type == FarmNFT.AnimalType.BEE) { rate = 57600; }

        require(msg.value >= price, "Insufficient STT sent for this tier");

        uint256 tokenId = farmNft.mintAnimal(msg.sender, _type, rate);
        userAnimalIds[msg.sender].push(tokenId);
        
        usedSlots[msg.sender]++;
        totalAnimalsCount++;
    }

    function expandFarm() public payable {
        if (maxSlots[msg.sender] == 0) maxSlots[msg.sender] = 1;
        require(maxSlots[msg.sender] < 100, "Maximum of 100 slots reached");
        require(msg.value == 100 ether, "Expansion cost is 100 STT");
        
        maxSlots[msg.sender] += 1;
        emit FarmExpanded(msg.sender, maxSlots[msg.sender]);
    }

    function harvest(uint256 animalId) public {
        require(farmNft.ownerOf(animalId) == msg.sender, "Not yours");
        FarmNFT.Animal memory animal = farmNft.getAnimal(animalId);
        uint256 timePassed = block.timestamp - animal.lastHarvest;
        uint256 amount = timePassed / animal.productionRate;
        if (amount > 10) amount = 10; // Capped at 10 products
        require(amount > 0, "Nothing to harvest yet");

        userInventory[msg.sender][animal.animalType] += amount;
        farmNft.updateLastHarvest(animalId);
        emit Harvested(msg.sender, animalId, animal.animalType, amount);
    }

    function levelUpAnimal(uint256 animalId) public payable {
        require(farmNft.ownerOf(animalId) == msg.sender, "Not yours");
        
        FarmNFT.Animal memory animal = farmNft.getAnimal(animalId);
        require(animal.level < 10, "Maximum level reached");

        uint256 upgradePrice = upgradePrices[animal.animalType];

        require(msg.value == upgradePrice, "Incorrect upgrade fee");

        // Force harvest
        uint256 timePassed = block.timestamp - animal.lastHarvest;
        uint256 amount = timePassed / animal.productionRate;
        if (amount > 10) amount = 10;
        
        if (amount > 0) {
            userInventory[msg.sender][animal.animalType] += amount;
            farmNft.updateLastHarvest(animalId);
            emit Harvested(msg.sender, animalId, animal.animalType, amount);
        }

        farmNft.upgradeAnimal(animalId);
    }

    function sellProduct(FarmNFT.AnimalType _type, uint256 _amount) public {
        require(userInventory[msg.sender][_type] >= _amount, "Insufficient products");
        
        uint256 payoutRate = products[_type].payout;
        uint256 totalPayout = payoutRate * _amount;
        
        require(address(this).balance >= totalPayout, "Insufficient treasury liquidity");

        userInventory[msg.sender][_type] -= _amount;
        payable(msg.sender).transfer(totalPayout);
        
        emit Sold(msg.sender, _type, _amount, totalPayout);
    }

    function getUserAnimals(address user) external view returns (uint256[] memory) {
        return userAnimalIds[user];
    }

    function setTreasury(address _newTreasury) public onlyOwner {
        treasury = _newTreasury;
    }

    receive() external payable {}

    function withdrawSTT() public onlyOwner {
        uint256 balance = address(this).balance;
        require(payable(msg.sender).send(balance), "Withdrawal failed");
    }

    function withdrawAmount(uint256 _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Insufficient balance");
        require(payable(msg.sender).send(_amount), "Withdrawal failed");
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(ISomniaEventHandler).interfaceId;
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
