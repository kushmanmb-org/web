# Cryptography and Confirmation Mechanisms

## Overview

The MultiSigWallet uses several cryptographic primitives and clever data structures to achieve secure, gas-efficient multi-signature functionality.

## 1. Operation Hashing

### Keccak-256 Hashing

The contract uses Ethereum's native `keccak256` hash function to create unique identifiers for operations:

```solidity
bytes32 operation = keccak256(abi.encodePacked(msg.data, block.number));
```

### What is `msg.data`?

`msg.data` contains the complete calldata sent to the contract:
- **Function selector** (4 bytes): First 4 bytes of keccak256(function signature)
- **Encoded parameters**: ABI-encoded function arguments

**Example:**
```solidity
// Call: addOwner(0x1234...)
msg.data = 
  0x7065cb48                                      // function selector
  0000000000000000000000001234567890123456789012345678901234567890  // address
```

### Why Include `block.number`?

Adding `block.number` ensures:
1. **Uniqueness**: Same operation in different blocks gets different hash
2. **Replay protection**: Cannot reuse confirmations across time
3. **Clarity**: Each block's operations are distinct

**Alternative approaches:**

| Method | Pros | Cons |
|--------|------|------|
| `msg.data + block.number` | Simple, automatic | Could conflict if same block |
| `msg.data + nonce` | More control | Requires nonce management |
| `msg.data + timestamp` | Time-based | Less precise than block |
| `hash(to, value, data)` | Explicit | Misses function context |

### Security Considerations

**Collision resistance:**
- Keccak-256 produces 256-bit output (2^256 possibilities)
- Birthday attack requires ~2^128 attempts
- Practically impossible to find collisions

**Pre-image resistance:**
- Cannot reverse hash to find original operation
- Secure for public blockchain visibility

## 2. Bitmap Confirmation Tracking

### The Problem

Traditional approaches to track confirmations:

**Approach 1: Array of Addresses**
```solidity
mapping(bytes32 => address[]) confirmations;
```
- ❌ Gas cost: ~20,000 per confirmation
- ❌ Need to iterate to check if confirmed
- ❌ Complex removal logic

**Approach 2: Nested Mapping**
```solidity
mapping(bytes32 => mapping(address => bool)) confirmed;
```
- ✅ Fast lookup
- ❌ Gas cost: ~20,000 per confirmation
- ❌ Expensive to count confirmations

### The Solution: Bitmap

```solidity
struct PendingTx {
    uint256 yetNeeded;    // Confirmations remaining
    uint256 ownersDone;   // Bitmap of confirmations
    uint256 index;        // Array position
}
```

**How it works:**

1. **Each owner gets a bit position:**
```solidity
uint256 ownerIndexBit = 2 ** ownerIndex[msg.sender];
```

2. **Set the bit to confirm:**
```solidity
pending.ownersDone |= ownerIndexBit;  // Bitwise OR
```

3. **Check if confirmed:**
```solidity
(pending.ownersDone & ownerIndexBit) > 0  // Bitwise AND
```

4. **Revoke confirmation:**
```solidity
pending.ownersDone &= ~ownerIndexBit;  // Bitwise AND NOT
```

### Mathematical Foundation

**Binary representation:**
- Each bit represents one owner's confirmation
- Position i (0-indexed) = 2^i in decimal

**Example with 5 owners:**

```
Owner Index:  0    1    2    3    4
Bit Value:    1    2    4    8   16
Binary:     0001 0010 0100 1000 10000
```

**Confirmation sequence:**

| Step | Owner | Operation | Binary | Decimal |
|------|-------|-----------|--------|---------|
| Initial | - | - | 00000 | 0 |
| 1 | Owner 2 | OR with 0100 | 00100 | 4 |
| 2 | Owner 0 | OR with 0001 | 00101 | 5 |
| 3 | Owner 4 | OR with 10000 | 10101 | 21 |
| Revoke | Owner 2 | AND with ~0100 | 10001 | 17 |

### Bitwise Operations Explained

**OR (|)**: Set bits
```
  00101  (existing)
| 01000  (new owner)
-------
  01101  (result)
```

**AND (&)**: Check bits
```
  01101  (existing)
& 01000  (check owner)
-------
  01000  (>0 = confirmed)
```

**AND NOT (&~)**: Clear bits
```
  01101  (existing)
& 10111  (~01000)
-------
  00101  (result)
```

### Gas Efficiency

**Storage costs:**
- Traditional mapping: 20,000 gas per storage write
- Bitmap: 5,000 gas to update existing, 20,000 for new

**Bitmap advantages:**
- All confirmations in 1 storage slot (256 bits)
- Checking confirmation: ~700 gas (memory operation)
- Supports up to 250 owners in theory

**Space complexity:**
- Mapping approach: O(n) storage slots for n confirmations
- Bitmap approach: O(1) storage slot for any number of confirmations

### Limitations

**Maximum owners: 250**

Why not 256?
```solidity
uint256 ownerIndexBit = 2 ** ownerIndex[msg.sender];
```

- `ownerIndex` starts at 1 (0 = not an owner)
- `2^255` is the maximum safe value
- `2^256` would overflow (though Solidity 0.8.x prevents this)
- Practical limit: 250 is more than sufficient

**Edge case handling:**
```solidity
require(m_numOwners < 250, "Max owners reached");
```

## 3. Comparison with Alternative Approaches

### A. Merkle Tree Confirmations

**Concept:**
- Store confirmations in off-chain Merkle tree
- Submit Merkle proof on-chain for verification

**Pros:**
- Unlimited confirmations
- Very low on-chain storage

**Cons:**
- Complex implementation
- Requires off-chain infrastructure
- Gas cost on proof verification
- Not suitable for dynamic confirmation

**Verdict:** Overkill for typical multisig use case

### B. BLS Signature Aggregation

**Concept:**
- Use BLS signatures to aggregate multiple signatures into one
- Single signature verification for all owners

**Pros:**
- Constant size signature
- Single verification cost

**Cons:**
- Requires BLS-compatible wallets
- Not supported by standard Ethereum wallets
- Pre-compilation needed for gas efficiency
- Complex key management

**Verdict:** Future potential, not practical today

### C. Schnorr Signatures (MPC)

**Concept:**
- Use Multi-Party Computation to create threshold signature
- Single signature represents N of M owners

**Pros:**
- Indistinguishable from single-sig on-chain
- Maximum privacy
- Gas efficient execution

**Cons:**
- Requires off-chain coordination
- Complex cryptography
- Trusted setup or interactive protocol
- Not transparent (can't see individual approvals)

**Verdict:** Different security model, trades transparency for efficiency

### D. EIP-712 Typed Data Signatures

**Concept:**
- Owners sign structured data off-chain
- Submit all signatures with transaction

**Pros:**
- Human-readable signatures
- No on-chain confirmation needed
- Cheaper execution

**Cons:**
- Must collect all signatures before execution
- No partial confirmation tracking
- Signature size grows with owners
- Cannot change mind once signed

**Example implementation:**
```solidity
bytes32 DOMAIN_SEPARATOR = keccak256(abi.encode(
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
    keccak256("MultiSigWallet"),
    keccak256("1"),
    block.chainid,
    address(this)
));

bytes32 digest = keccak256(abi.encodePacked(
    "\x19\x01",
    DOMAIN_SEPARATOR,
    keccak256(abi.encode(TX_TYPEHASH, to, value, keccak256(data), nonce))
));

address signer = ecrecover(digest, v, r, s);
```

**Verdict:** Great for one-shot transactions, not for dynamic confirmation

## 4. Security Analysis

### Attack Vectors

**1. Confirmation Spoofing**
- ❌ Cannot confirm for another owner
- ✓ Bitmap index tied to msg.sender
- ✓ ownerIndex mapping enforces identity

**2. Double Confirmation**
```solidity
if ((pending.ownersDone & ownerIndexBit) > 0) {
    return false;  // Already confirmed
}
```

**3. Replay Attacks**
- ❌ Cannot reuse old confirmations
- ✓ Operation hash includes block.number
- ✓ Each block = new operation

**4. Front-Running**
- ⚠️ Possible but not problematic
- Scenario: Attacker sees confirmation, front-runs to execute first
- Impact: Transaction executes as intended (same result)
- Not a vulnerability: Executes legitimate transaction

**5. Bitmap Overflow**
```solidity
require(m_numOwners < 250, "Max owners reached");
```
- ✓ Prevents adding too many owners
- ✓ Prevents overflow in 2^ownerIndex

### Formal Verification Considerations

**Properties to verify:**

1. **Safety:** Transaction executes only with sufficient confirmations
```
∀ tx: executed(tx) → confirmations(tx) ≥ required
```

2. **Liveness:** With sufficient confirmations, transaction can execute
```
∀ tx: confirmations(tx) ≥ required → canExecute(tx)
```

3. **Uniqueness:** Each owner confirms at most once
```
∀ tx, owner: confirmed(tx, owner) → confirmCount(tx, owner) = 1
```

4. **Bitmap consistency:** Bitmap matches actual confirmations
```
∀ tx, owner: bit(tx, owner) = 1 ↔ confirmed(tx, owner)
```

## 5. Future Cryptographic Enhancements

### Zero-Knowledge Proofs

**Use case:** Prove transaction validity without revealing details

```solidity
function executeWithProof(
    bytes32 commitment,
    uint256[2] memory proof,
    uint256[2] memory publicSignals
) external {
    require(verifyZKProof(commitment, proof, publicSignals), "Invalid proof");
    // Execute hidden transaction
}
```

**Benefits:**
- Privacy for transaction details
- Confidential multi-sig operations

**Challenges:**
- High gas costs (>1M gas for verification)
- Complex proof generation
- Requires ZK-SNARK setup

### Threshold Encryption

**Use case:** Encrypt transaction data, decrypt only with t-of-n keys

**Benefits:**
- Data privacy until execution
- Prevents front-running of transaction details

**Challenges:**
- Complex key management
- Off-chain coordination required

## Conclusion

The bitmap confirmation mechanism provides an optimal balance of:
- ✅ Gas efficiency
- ✅ Simplicity
- ✅ Security
- ✅ On-chain transparency
- ✅ No off-chain dependencies

While more advanced cryptographic techniques exist, they typically sacrifice transparency or require significant additional complexity. The bitmap approach is battle-tested and well-suited for Ethereum multisig wallets.
