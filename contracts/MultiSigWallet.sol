// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MultiSigWallet
 * @notice A multi-signature wallet with daily spending limits
 * @dev Requires multiple owner confirmations for transactions above daily limit
 */
contract MultiSigWallet {
    
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event Deposit(address indexed sender, uint256 value);
    event Confirmation(address indexed owner, bytes32 indexed operation);
    event Revoke(address indexed owner, bytes32 indexed operation);
    event OwnerAdded(address indexed newOwner);
    event OwnerRemoved(address indexed oldOwner);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event RequirementChanged(uint256 newRequirement);
    event SingleTransact(address indexed owner, uint256 value, address indexed to, bytes data);
    event MultiTransact(address indexed owner, bytes32 indexed operation, uint256 value, address indexed to, bytes data);
    event ConfirmationNeeded(bytes32 indexed operation, address indexed initiator, uint256 value, address indexed to, bytes data);

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    uint256 public m_required;
    uint256 public m_numOwners;
    uint256 public m_dailyLimit;
    
    mapping(address => uint256) public ownerIndex;
    address[] public owners;
    
    struct PendingTx {
        uint256 yetNeeded;
        uint256 ownersDone;
        uint256 index;
    }
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
    }
    
    mapping(bytes32 => PendingTx) public pendingTxs;
    mapping(bytes32 => Transaction) public transactions;
    bytes32[] public pendingIndex;
    
    uint256 public spentToday;
    uint256 public lastDay;
    
    bool private locked;

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/
    
    modifier onlyOwner() {
        require(ownerIndex[msg.sender] > 0, "Not an owner");
        _;
    }
    
    modifier ownerDoesNotExist(address owner) {
        require(ownerIndex[owner] == 0, "Owner already exists");
        _;
    }
    
    modifier ownerExists(address owner) {
        require(ownerIndex[owner] > 0, "Owner does not exist");
        _;
    }
    
    modifier validRequirement(uint256 ownerCount, uint256 _required) {
        require(
            ownerCount <= 250 && 
            _required <= ownerCount && 
            _required > 0 && 
            ownerCount > 0,
            "Invalid requirement"
        );
        _;
    }
    
    modifier noReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    constructor(
        address[] memory _owners,
        uint256 _required,
        uint256 _dailyLimit
    ) validRequirement(_owners.length, _required) {
        require(_owners.length > 0, "Owners required");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner");
            require(ownerIndex[_owners[i]] == 0, "Duplicate owner");
            
            ownerIndex[_owners[i]] = i + 1;
            owners.push(_owners[i]);
        }
        
        m_numOwners = _owners.length;
        m_required = _required;
        m_dailyLimit = _dailyLimit;
        lastDay = block.timestamp / 1 days;
    }

    receive() external payable {
        if (msg.value > 0) {
            emit Deposit(msg.sender, msg.value);
        }
    }

    function execute(
        address _to,
        uint256 _value,
        bytes memory _data
    ) external onlyOwner noReentrant returns (bytes32 operationHash) {
        
        if (_underLimit(_value)) {
            emit SingleTransact(msg.sender, _value, _to, _data);
            _execute(_to, _value, _data);
            return 0;
        }
        
        operationHash = keccak256(abi.encodePacked(msg.data, block.number));
        
        if (transactions[operationHash].to == address(0)) {
            transactions[operationHash] = Transaction({
                to: _to,
                value: _value,
                data: _data
            });
            emit ConfirmationNeeded(operationHash, msg.sender, _value, _to, _data);
        }
        
        confirm(operationHash);
    }
    
    function confirm(bytes32 _operation) public onlyOwner returns (bool success) {
        PendingTx storage pending = pendingTxs[_operation];
        
        if (pending.yetNeeded == 0) {
            pending.yetNeeded = m_required;
            pending.index = pendingIndex.length;
            pendingIndex.push(_operation);
        }
        
        uint256 ownerIndexBit = 2 ** ownerIndex[msg.sender];
        if ((pending.ownersDone & ownerIndexBit) > 0) {
            return false;
        }
        
        emit Confirmation(msg.sender, _operation);
        
        if (pending.yetNeeded <= 1) {
            Transaction memory txn = transactions[_operation];
            
            if (txn.to != address(0)) {
                emit MultiTransact(msg.sender, _operation, txn.value, txn.to, txn.data);
                _execute(txn.to, txn.value, txn.data);
            }
            
            _clearPending(_operation);
            delete transactions[_operation];
            
            return true;
        } else {
            pending.yetNeeded--;
            pending.ownersDone |= ownerIndexBit;
            return false;
        }
    }
    
    function revoke(bytes32 _operation) external onlyOwner {
        PendingTx storage pending = pendingTxs[_operation];
        uint256 ownerIndexBit = 2 ** ownerIndex[msg.sender];
        
        if ((pending.ownersDone & ownerIndexBit) > 0) {
            pending.yetNeeded++;
            pending.ownersDone &= ~ownerIndexBit;
            emit Revoke(msg.sender, _operation);
        }
    }

    function addOwner(address _owner) external onlyOwner ownerDoesNotExist(_owner) {
        bytes32 operation = keccak256(msg.data);
        
        if (_confirmAndCheck(operation)) {
            require(m_numOwners < 250, "Max owners reached");
            
            ownerIndex[_owner] = owners.length + 1;
            owners.push(_owner);
            m_numOwners++;
            
            _clearPendingAll();
            emit OwnerAdded(_owner);
        }
    }
    
    function removeOwner(address _owner) external onlyOwner ownerExists(_owner) {
        bytes32 operation = keccak256(msg.data);
        
        if (_confirmAndCheck(operation)) {
            require(m_required <= m_numOwners - 1, "Would break requirement");
            
            uint256 index = ownerIndex[_owner] - 1;
            owners[index] = owners[owners.length - 1];
            ownerIndex[owners[index]] = index + 1;
            owners.pop();
            
            delete ownerIndex[_owner];
            m_numOwners--;
            
            _clearPendingAll();
            emit OwnerRemoved(_owner);
        }
    }
    
    function changeOwner(
        address _from,
        address _to
    ) external onlyOwner ownerExists(_from) ownerDoesNotExist(_to) {
        bytes32 operation = keccak256(msg.data);
        
        if (_confirmAndCheck(operation)) {
            uint256 index = ownerIndex[_from] - 1;
            owners[index] = _to;
            ownerIndex[_to] = ownerIndex[_from];
            delete ownerIndex[_from];
            
            _clearPendingAll();
            emit OwnerChanged(_from, _to);
        }
    }

    function changeRequirement(uint256 _newRequired) 
        external 
        onlyOwner 
        validRequirement(m_numOwners, _newRequired) 
    {
        bytes32 operation = keccak256(msg.data);
        
        if (_confirmAndCheck(operation)) {
            m_required = _newRequired;
            _clearPendingAll();
            emit RequirementChanged(_newRequired);
        }
    }
    
    function setDailyLimit(uint256 _newLimit) external onlyOwner {
        bytes32 operation = keccak256(msg.data);
        
        if (_confirmAndCheck(operation)) {
            m_dailyLimit = _newLimit;
        }
    }
    
    function resetSpentToday() external onlyOwner {
        bytes32 operation = keccak256(msg.data);
        
        if (_confirmAndCheck(operation)) {
            spentToday = 0;
        }
    }

    function isOwner(address _owner) external view returns (bool) {
        return ownerIndex[_owner] > 0;
    }
    
    function hasConfirmed(bytes32 _operation, address _owner) 
        external 
        view 
        returns (bool) 
    {
        if (ownerIndex[_owner] == 0) return false;
        
        uint256 ownerIndexBit = 2 ** ownerIndex[_owner];
        return (pendingTxs[_operation].ownersDone & ownerIndexBit) > 0;
    }
    
    function getPendingTransactions() external view returns (bytes32[] memory) {
        return pendingIndex;
    }
    
    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function _execute(address _to, uint256 _value, bytes memory _data) internal {
        (bool success, ) = _to.call{value: _value}(_data);
        require(success, "Transaction failed");
    }
    
    function _underLimit(uint256 _value) internal returns (bool) {
        if (block.timestamp / 1 days > lastDay) {
            spentToday = 0;
            lastDay = block.timestamp / 1 days;
        }
        
        if (spentToday + _value > m_dailyLimit || spentToday + _value < spentToday) {
            return false;
        }
        
        spentToday += _value;
        return true;
    }
    
    function _confirmAndCheck(bytes32 _operation) internal returns (bool) {
        PendingTx storage pending = pendingTxs[_operation];
        
        if (pending.yetNeeded == 0) {
            pending.yetNeeded = m_required;
            pending.index = pendingIndex.length;
            pendingIndex.push(_operation);
        }
        
        uint256 ownerIndexBit = 2 ** ownerIndex[msg.sender];
        
        if ((pending.ownersDone & ownerIndexBit) > 0) {
            return false;
        }
        
        emit Confirmation(msg.sender, _operation);
        
        if (pending.yetNeeded <= 1) {
            _clearPending(_operation);
            return true;
        }
        
        pending.yetNeeded--;
        pending.ownersDone |= ownerIndexBit;
        return false;
    }
    
    function _clearPending(bytes32 _operation) internal {
        uint256 index = pendingTxs[_operation].index;
        
        if (pendingIndex.length > 1) {
            pendingIndex[index] = pendingIndex[pendingIndex.length - 1];
            pendingTxs[pendingIndex[index]].index = index;
        }
        
        pendingIndex.pop();
        delete pendingTxs[_operation];
    }
    
    function _clearPendingAll() internal {
        uint256 length = pendingIndex.length;
        
        for (uint256 i = 0; i < length; i++) {
            delete transactions[pendingIndex[i]];
            delete pendingTxs[pendingIndex[i]];
        }
        
        delete pendingIndex;
    }
}
