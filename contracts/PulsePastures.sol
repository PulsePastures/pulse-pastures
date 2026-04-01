// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PulsePastures is ERC721, Ownable {
    IERC20 public virtualToken;
    uint256 private _nextTokenId;

    uint256 public slotPrice = 0.01 ether; // 0.01 VIRTUAL

    function setSlotPrice(uint256 _newPrice) external onlyOwner {
        slotPrice = _newPrice;
    }

    mapping(uint8 => uint256) public animalPrices;
    mapping(uint8 => uint256) public baseUpgradePrices;
    mapping(uint8 => uint256) public productionRates;

    function setAnimalPrice(uint8 _type, uint256 _price) external onlyOwner {
        animalPrices[_type] = _price;
    }

    function setBaseUpgradePrice(uint8 _type, uint256 _price) external onlyOwner {
        baseUpgradePrices[_type] = _price;
    }

    function setProductionRate(uint8 _type, uint256 _rate) external onlyOwner {
        productionRates[_type] = _rate;
    }

    function setProductPrice(uint8 _type, uint256 _price) external onlyOwner {
        products[_type].payout = _price;
    }

    function setEconomy(
        uint256 _slotPrice,
        uint256[] calldata _animalPrices,
        uint256[] calldata _productionRates,
        uint256[] calldata _baseUpgradePrices,
        uint256[] calldata _productPrices
    ) external onlyOwner {
        slotPrice = _slotPrice;
        for (uint8 i = 0; i < 6; i++) {
            animalPrices[i] = _animalPrices[i];
            productionRates[i] = _productionRates[i];
            baseUpgradePrices[i] = _baseUpgradePrices[i];
            products[i].payout = _productPrices[i];
        }
    }

    enum AnimalType { CHICKEN, SHEEP, COW, GOAT, PIG, BEE }

    struct Animal {
        AnimalType animalType;
        uint256 birthTime;
        uint256 lastHarvest;
        uint256 level;
    }

    struct Product {
        string name;
        uint256 payout; // Payout in VIRTUAL tokens
    }

    mapping(uint256 => Animal) public animals;
    mapping(address => mapping(uint8 => uint256)) public userInventory;
    mapping(address => uint256[]) public userAnimalIds;
    mapping(address => uint256) private _maxSlots;
    mapping(uint8 => Product) public products;

    function maxSlots(address user) public view returns (uint256) {
        uint256 current = _maxSlots[user];
        return current == 0 ? 1 : current;
    }

    event AnimalBought(address indexed user, uint8 animalType, uint256 tokenId);
    event FarmExpanded(address indexed user, uint256 newMaxSlots);
    event Harvested(address indexed user, uint256 animalId, uint8 animalType, uint256 amount);
    event Sold(address indexed user, uint8 animalType, uint256 amount, uint256 totalPayout);
    event LevelUp(address indexed user, uint256 animalId, uint256 newLevel);

    constructor(address _virtualToken) ERC721("Pulse Pastures", "PULSE") Ownable(msg.sender) {
        virtualToken = IERC20(_virtualToken);

        products[uint8(AnimalType.CHICKEN)] = Product("Egg", 0.001 ether);
        products[uint8(AnimalType.SHEEP)]   = Product("Wool", 0.003 ether);
        products[uint8(AnimalType.COW)]     = Product("Milk", 0.005 ether);
        products[uint8(AnimalType.GOAT)]    = Product("Cheese", 0.009 ether);
        products[uint8(AnimalType.PIG)]     = Product("Bacon", 0.013 ether);
        products[uint8(AnimalType.BEE)]     = Product("Honey", 0.016 ether);

        animalPrices[uint8(AnimalType.CHICKEN)] = 0.01 ether;
        animalPrices[uint8(AnimalType.SHEEP)]   = 0.02 ether;
        animalPrices[uint8(AnimalType.COW)]     = 0.03 ether;
        animalPrices[uint8(AnimalType.GOAT)]    = 0.04 ether;
        animalPrices[uint8(AnimalType.PIG)]     = 0.05 ether;
        animalPrices[uint8(AnimalType.BEE)]     = 0.06 ether;

        productionRates[uint8(AnimalType.BEE)]     = 1;

        baseUpgradePrices[uint8(AnimalType.CHICKEN)] = 0.01 ether;
        baseUpgradePrices[uint8(AnimalType.SHEEP)]   = 0.01 ether;
        baseUpgradePrices[uint8(AnimalType.COW)]     = 0.01 ether;
        baseUpgradePrices[uint8(AnimalType.GOAT)]    = 0.01 ether;
        baseUpgradePrices[uint8(AnimalType.PIG)]     = 0.01 ether;
        baseUpgradePrices[uint8(AnimalType.BEE)]     = 0.01 ether;
    }

    function buyAnimal(uint8 _type) public {
        require(userAnimalIds[msg.sender].length < maxSlots(msg.sender), "Farm capacity full");
        require(virtualToken.transferFrom(msg.sender, address(this), animalPrices[_type]), "Payment failed");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        // Initializing with global dynamic rates implicitly
        animals[tokenId] = Animal(AnimalType(_type), block.timestamp, block.timestamp, 1);
        userAnimalIds[msg.sender].push(tokenId);

        emit AnimalBought(msg.sender, _type, tokenId);
    }

    function expandFarm() public {
        require(virtualToken.transferFrom(msg.sender, address(this), slotPrice), "Payment failed");
        
        uint256 current = maxSlots(msg.sender);
        _maxSlots[msg.sender] = current + 1; // Expands by 1 capacity

        emit FarmExpanded(msg.sender, _maxSlots[msg.sender]);
    }

    function harvest(uint256 animalId) public {
        require(ownerOf(animalId) == msg.sender, "Not the animal owner");
        Animal storage animal = animals[animalId];
        
        uint256 timePassed = block.timestamp - animal.lastHarvest;
        uint8 aType = uint8(animal.animalType);
        
        // Dynamic production rate: N items per hour (default 1)
        uint256 hourlyRate = productionRates[aType];
        if (hourlyRate == 0) hourlyRate = 1;
        
        // amount produced = (time * rate * level) / 86400 (Daily Rate)
        uint256 amount = (timePassed * hourlyRate * animal.level) / 86400;
        if (amount > 30 * animal.level * hourlyRate) {
            amount = 30 * animal.level * hourlyRate; // Dynamic cap so yield isn't infinite (increased for daily)
        }
        
        require(amount > 0, "Nothing to harvest yet");

        userInventory[msg.sender][aType] += amount;
        animal.lastHarvest = block.timestamp;

        emit Harvested(msg.sender, animalId, aType, amount);
    }

    function sellProduct(uint8 _type, uint256 _amount) public {
        require(_amount > 0, "Must sell more than 0");
        require(userInventory[msg.sender][_type] >= _amount, "Insufficient stock");

        uint256 payoutPerUnit = products[_type].payout;
        uint256 totalPayout = payoutPerUnit * _amount;

        require(virtualToken.balanceOf(address(this)) >= totalPayout, "Contract out of funds to pay reward");

        userInventory[msg.sender][_type] -= _amount;
        
        // Puts VIRTUAL directly into user's wallet
        require(virtualToken.transfer(msg.sender, totalPayout), "Transfer reward failed");

        emit Sold(msg.sender, _type, _amount, totalPayout);
    }

    function levelUpAnimal(uint256 animalId) public {
        require(ownerOf(animalId) == msg.sender, "Not the animal owner");
        
        Animal storage animal = animals[animalId];
        uint8 aType = uint8(animal.animalType);
        
        // Doubling cost: baseUpgradePrice * 2^(level-1)
        uint256 cost = baseUpgradePrices[aType] * (2 ** (animal.level - 1));
        
        require(virtualToken.transferFrom(msg.sender, address(this), cost), "Payment failed");

        animal.level += 1;
        emit LevelUp(msg.sender, animalId, animal.level);
    }

    function getUserAnimals(address user) public view returns (uint256[] memory) {
        return userAnimalIds[user];
    }

    function getAnimal(uint256 tokenId) public view returns (Animal memory) {
        return animals[tokenId];
    }
    
    // Owner can withdraw collected VIRTUAL tokens
    function withdrawVirtual(uint256 amount) external onlyOwner {
        require(virtualToken.transfer(msg.sender, amount), "Withdrawal failed");
    }

    // Owner can deposit VIRTUAL tokens to fund the reward pool
    function depositVirtual(uint256 amount) external {
        require(virtualToken.transferFrom(msg.sender, address(this), amount), "Deposit failed");
    }
}
