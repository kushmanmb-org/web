# MultiSig Wallet Architecture

## Overview

The MultiSigWallet is a smart contract implementation that requires multiple owner signatures to execute transactions above a daily spending limit. This architecture provides enhanced security for managing shared funds while maintaining usability for daily operations.

## Core Components

### 1. Ownership System

The contract uses a **1-indexed mapping** approach for tracking owners:

```solidity
mapping(address => uint256) public ownerIndex;
address[] public owners;
```

- `ownerIndex[address]`: Maps owner addresses to their index + 1 (0 = not an owner)
- `owners[]`: Array storing all owner addresses
- Using index + 1 allows checking `ownerIndex[addr] > 0` to verify ownership

**Benefits:**
- Gas-efficient owner lookup: O(1) time complexity
- Easy iteration through owners array
- Simple owner existence check

### 2. Transaction Pending System

The contract tracks pending transactions using a dual structure:

```solidity
struct PendingTx {
    uint256 yetNeeded;    // Confirmations still needed
    uint256 ownersDone;   // Bitmap of confirming owners
    uint256 index;        // Position in pendingIndex array
}

mapping(bytes32 => PendingTx) public pendingTxs;
bytes32[] public pendingIndex;
```

**Operation Flow:**
1. Transaction initiated → Operation hash generated
2. Hash stored in `pendingIndex` array for iteration
3. `PendingTx` created with `yetNeeded = m_required`
4. Owners confirm → Bits set in `ownersDone` bitmap
5. When `yetNeeded == 1` → Execute and clean up

### 3. Bitmap Confirmation Tracking

The most innovative aspect is using a **single uint256 as a bitmap** to track confirmations:

```solidity
uint256 ownerIndexBit = 2 ** ownerIndex[msg.sender];
pending.ownersDone |= ownerIndexBit;  // Set bit
```

**How it works:**
- Each owner has a unique bit position (2^index)
- Owner at index 1 → bit 2^1 = 2 = 0b0010
- Owner at index 2 → bit 2^2 = 4 = 0b0100
- Owner at index 3 → bit 2^3 = 8 = 0b1000

**Benefits:**
- Maximum 250 owners (2^250 fits in uint256)
- Single storage slot for all confirmations
- Gas-efficient: bit operations are cheap
- Easy check: `(ownersDone & ownerIndexBit) > 0`

**Example with 3 owners:**
```
Initial:     ownersDone = 0b0000
Owner 1:     ownersDone = 0b0010 (2^1 = 2)
Owner 2:     ownersDone = 0b0110 (added 2^2 = 4)
Owner 3:     ownersDone = 0b1110 (added 2^3 = 8)
```

### 4. Daily Limit System

Implements a **rolling 24-hour spending limit**:

```solidity
uint256 public m_dailyLimit;
uint256 public spentToday;
uint256 public lastDay;

function _underLimit(uint256 _value) internal returns (bool) {
    if (block.timestamp / 1 days > lastDay) {
        spentToday = 0;
        lastDay = block.timestamp / 1 days;
    }
    
    if (spentToday + _value > m_dailyLimit || 
        spentToday + _value < spentToday) {  // Overflow check
        return false;
    }
    
    spentToday += _value;
    return true;
}
```

**Features:**
- Automatic reset at midnight (based on `block.timestamp / 1 days`)
- Overflow protection (Solidity 0.8.x also has built-in)
- Gas-efficient: Only updates on transaction execution

### 5. Operation Hashing

Generates unique identifiers for pending operations:

```solidity
bytes32 operation = keccak256(abi.encodePacked(msg.data, block.number));
```

**Why `msg.data + block.number`?**
- `msg.data`: Includes function signature and all parameters
- `block.number`: Ensures uniqueness across blocks
- Prevents collision: Same transaction in different blocks = different operation

**Alternative considered:**
```solidity
keccak256(abi.encodePacked(_to, _value, _data, nonce))
```
Pro: More explicit
Con: Requires additional nonce storage

### 6. Two-Phase Transaction System

**Phase 1: Under Daily Limit**
```
Owner → execute() → _underLimit() → _execute() → Complete
```

**Phase 2: Above Daily Limit**
```
Owner 1 → execute() → Create pending tx → Emit ConfirmationNeeded
Owner 2 → confirm() → yetNeeded-- → Check threshold
Owner 3 → confirm() → yetNeeded == 1 → _execute() → Complete
```

### 7. Reentrancy Protection

Uses a simple boolean lock:

```solidity
bool private locked;

modifier noReentrant() {
    require(!locked, "Reentrant call");
    locked = true;
    _;
    locked = false;
}
```

**Protected functions:**
- `execute()`: All external calls

**Why not OpenZeppelin's ReentrancyGuard?**
- Lighter weight
- Sufficient for this use case
- Gas savings (one less external call)

### 8. Cleanup Mechanism

Two cleanup functions maintain efficiency:

**_clearPending()**: Removes single operation
```solidity
function _clearPending(bytes32 _operation) internal {
    uint256 index = pendingTxs[_operation].index;
    
    // Swap and pop pattern
    if (pendingIndex.length > 1) {
        pendingIndex[index] = pendingIndex[pendingIndex.length - 1];
        pendingTxs[pendingIndex[index]].index = index;
    }
    
    pendingIndex.pop();
    delete pendingTxs[_operation];
}
```

**_clearPendingAll()**: Clears all (after owner changes)
```solidity
function _clearPendingAll() internal {
    uint256 length = pendingIndex.length;
    
    for (uint256 i = 0; i < length; i++) {
        delete transactions[pendingIndex[i]];
        delete pendingTxs[pendingIndex[i]];
    }
    
    delete pendingIndex;
}
```

**Why clear all on owner changes?**
- Bitmap positions change when owners added/removed
- Old confirmations become invalid
- Prevents confusion and security issues

## Security Features

### 1. Access Control
- `onlyOwner` modifier on all sensitive functions
- `ownerExists` / `ownerDoesNotExist` for owner management
- `validRequirement` ensures valid configuration

### 2. Input Validation
- Zero address checks
- Duplicate owner prevention
- Requirement bounds (1 ≤ required ≤ owners ≤ 250)

### 3. Integer Safety
- Solidity 0.8.x built-in overflow protection
- Additional overflow check in daily limit

### 4. State Consistency
- Clear pending transactions on owner changes
- Atomic operations where possible
- Proper event emission

## Gas Optimization

1. **Bitmap vs Array**: Storing confirmations in bitmap uses 1 storage slot vs N slots
2. **Packed Storage**: Related variables grouped for storage packing
3. **Early Returns**: Check conditions before state changes
4. **Minimal Loops**: Only iterate when necessary
5. **Delete Usage**: Proper cleanup returns gas refunds

## Upgrade Considerations

This contract is **not upgradeable** by design:
- Immutable after deployment
- No proxy pattern
- Trustless: Code cannot change

**To upgrade:**
1. Deploy new contract
2. Execute transaction to transfer funds
3. Update frontend to point to new address

## Event Logging

Comprehensive events for off-chain tracking:
- `Confirmation` / `Revoke`: Tracking owner approvals
- `SingleTransact` / `MultiTransact`: Transaction execution
- `ConfirmationNeeded`: New pending transaction
- `OwnerAdded` / `OwnerRemoved` / `OwnerChanged`: Owner management
- `RequirementChanged`: Configuration changes
- `Deposit`: Incoming funds

## Comparison with Original Implementation

This is a **cleaned and modernized version** of a decompiled multisig wallet with:

**Improvements:**
- Solidity 0.8.x (overflow protection)
- Explicit reentrancy guard
- Better code organization (sections)
- Comprehensive NatSpec documentation
- Modern naming conventions
- Additional view functions

**Preserved:**
- Original bitmap confirmation mechanism
- Daily limit logic
- Operation hashing approach
- Core security model

## Future Enhancements

Potential additions (would require new deployment):
1. **EIP-712 Signatures**: Off-chain signature collection
2. **Time Locks**: Delay execution for security
3. **Spending Categories**: Different limits per category
4. **Emergency Pause**: Owner-activated pause mechanism
5. **Gas Station Network**: Meta-transactions for gasless confirms
