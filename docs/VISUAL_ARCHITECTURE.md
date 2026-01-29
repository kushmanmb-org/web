# MultiSig Wallet - Visual Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MultiSig Wallet System                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐        ┌──────────────────┐        ┌─────────────┐
│   Owner Wallet   │        │   Owner Wallet   │        │ Owner Wallet│
│    (MetaMask)    │        │    (Ledger)      │        │  (Coinbase) │
└────────┬─────────┘        └────────┬─────────┘        └──────┬──────┘
         │                           │                          │
         │                           │                          │
         └───────────────┬───────────┴──────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   Frontend React Component        │
         │  - Wallet Connection              │
         │  - Transaction UI                 │
         │  - Owner Management               │
         │  - Real-time Updates              │
         └───────────────┬───────────────────┘
                         │
                         │ ethers.js
                         │
                         ▼
         ┌───────────────────────────────────┐
         │   MultiSigWallet.sol (Base)       │
         │                                   │
         │  ┌─────────────────────────────┐ │
         │  │ Ownership System            │ │
         │  │ - ownerIndex mapping        │ │
         │  │ - owners array              │ │
         │  └─────────────────────────────┘ │
         │                                   │
         │  ┌─────────────────────────────┐ │
         │  │ Transaction System          │ │
         │  │ - Daily limit check         │ │
         │  │ - Pending transactions      │ │
         │  │ - Bitmap confirmations      │ │
         │  └─────────────────────────────┘ │
         │                                   │
         │  ┌─────────────────────────────┐ │
         │  │ Security                    │ │
         │  │ - Reentrancy guard          │ │
         │  │ - Access control            │ │
         │  │ - Event logging             │ │
         │  └─────────────────────────────┘ │
         └───────────────────────────────────┘
```

## Transaction Flow

### Small Transaction (Under Daily Limit)

```
Owner initiates transaction (0.5 ETH, limit 1 ETH)
         │
         ▼
┌─────────────────────┐
│ execute()           │
│ - Check onlyOwner   │
│ - Check _underLimit │◄────── spentToday = 0.3 ETH
└─────────┬───────────┘        dailyLimit = 1.0 ETH
          │                    0.3 + 0.5 < 1.0 ✓
          ▼
┌─────────────────────┐
│ _execute()          │
│ - Call external     │
│ - Transfer funds    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ emit SingleTransact │
└─────────────────────┘
          │
          ▼
     ✅ Complete (single transaction)
```

### Large Transaction (Above Daily Limit)

```
Owner 1 initiates transaction (2 ETH, limit 1 ETH)
         │
         ▼
┌──────────────────────────┐
│ execute()                │
│ - Check onlyOwner        │
│ - Check _underLimit      │◄────── spentToday = 0 ETH
└─────────┬────────────────┘        dailyLimit = 1.0 ETH
          │                         0 + 2 > 1.0 ✗
          ▼
┌──────────────────────────┐
│ Create operation hash    │
│ keccak256(msg.data +     │
│           block.number)  │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ Store transaction        │
│ transactions[hash] = {   │
│   to, value, data        │
│ }                        │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ emit ConfirmationNeeded  │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ confirm(hash)            │
│ Owner 1 confirms         │
│ yetNeeded = 2 → 1        │
│ ownersDone |= 0b0010     │
└─────────┬────────────────┘
          │
          ▼
     ⏳ Waiting for more confirmations
          │
          │ Owner 2 calls confirm(hash)
          ▼
┌──────────────────────────┐
│ confirm(hash)            │
│ Owner 2 confirms         │
│ yetNeeded = 1 → 0        │
│ ownersDone |= 0b0100     │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ yetNeeded <= 1?          │
│ Yes! Execute             │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ _execute()               │
│ emit MultiTransact       │
│ _clearPending()          │
└─────────┬────────────────┘
          │
          ▼
     ✅ Complete (multi-sig transaction)
```

## Bitmap Confirmation Tracking

```
Example: 3 owners, 2 required

Initial State:
┌────────────────────────────────────┐
│ PendingTx                          │
│ - yetNeeded: 2                     │
│ - ownersDone: 0b0000 (0)          │
│ - index: 0                         │
└────────────────────────────────────┘

Owner 1 (index=1) confirms:
┌────────────────────────────────────┐
│ ownerIndexBit = 2^1 = 2 = 0b0010  │
│ ownersDone |= ownerIndexBit        │
│ ownersDone = 0b0010 (2)           │
│ yetNeeded = 1                      │
└────────────────────────────────────┘

Owner 2 (index=2) confirms:
┌────────────────────────────────────┐
│ ownerIndexBit = 2^2 = 4 = 0b0100  │
│ ownersDone |= ownerIndexBit        │
│ ownersDone = 0b0110 (6)           │
│ yetNeeded = 0 ✓ EXECUTE!           │
└────────────────────────────────────┘

Check if Owner 1 confirmed:
┌────────────────────────────────────┐
│ ownersDone & 0b0010 = 0b0010       │
│ Result > 0? YES ✓                  │
└────────────────────────────────────┘

Check if Owner 3 confirmed:
┌────────────────────────────────────┐
│ ownersDone & 0b1000 = 0b0000       │
│ Result > 0? NO ✗                   │
└────────────────────────────────────┘
```

## Owner Management Flow

```
Add Owner Proposal
         │
         ▼
┌─────────────────────────┐
│ Owner 1: addOwner(addr) │
│ - Generate op hash      │
│ - Store proposal        │
│ - Auto-confirm          │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Owner 2: addOwner(addr) │
│ - Same op hash          │
│ - Confirm               │
│ - Threshold reached?    │
└─────────┬───────────────┘
          │ Yes (2 of 2)
          ▼
┌─────────────────────────┐
│ Execute                 │
│ - Add to owners[]       │
│ - Set ownerIndex        │
│ - Increment m_numOwners │
│ - _clearPendingAll()    │◄─── Important!
│ - emit OwnerAdded       │
└─────────────────────────┘
          │
          ▼
     ✅ Owner added

Why _clearPendingAll()?
┌─────────────────────────────────────┐
│ Bitmap positions change when        │
│ owners are added/removed.           │
│ Old confirmations become invalid.   │
│ Must clear all pending for safety.  │
└─────────────────────────────────────┘
```

## Daily Limit Reset

```
Day 1 (00:00-23:59)
┌─────────────────────────┐
│ lastDay = 19750         │
│ spentToday = 0          │
└─────────┬───────────────┘
          │
          │ Transaction: 0.3 ETH
          ▼
┌─────────────────────────┐
│ _underLimit(0.3)        │
│ Current day = 19750     │
│ Same day ✓              │
│ 0 + 0.3 < 1.0 ✓         │
│ spentToday = 0.3        │
└─────────┬───────────────┘
          │
          │ Transaction: 0.5 ETH
          ▼
┌─────────────────────────┐
│ _underLimit(0.5)        │
│ Current day = 19750     │
│ Same day ✓              │
│ 0.3 + 0.5 < 1.0 ✓       │
│ spentToday = 0.8        │
└─────────┬───────────────┘
          │
          │ Transaction: 0.5 ETH
          ▼
┌─────────────────────────┐
│ _underLimit(0.5)        │
│ Current day = 19750     │
│ Same day ✓              │
│ 0.8 + 0.5 > 1.0 ✗       │
│ Return false            │
└─────────┬───────────────┘
          │
          ▼
     Requires multi-sig ⏳


Day 2 (00:00)
          │
          │ Transaction: 0.5 ETH
          ▼
┌─────────────────────────┐
│ _underLimit(0.5)        │
│ Current day = 19751     │
│ 19751 > 19750 ✓         │
│ NEW DAY! Reset:         │
│ spentToday = 0          │
│ lastDay = 19751         │
│ 0 + 0.5 < 1.0 ✓         │
│ spentToday = 0.5        │
└─────────────────────────┘
          │
          ▼
     ✅ Execute immediately
```

## File Structure

```
web/
├── contracts/
│   └── MultiSigWallet.sol          ← Smart contract
├── test/
│   └── MultiSigWallet.test.js      ← Test suite
├── scripts/
│   └── deploy.js                   ← Deployment script
├── docs/
│   ├── ARCHITECTURE.md             ← Design details
│   ├── CRYPTOGRAPHY.md             ← Crypto explained
│   ├── WALLET_COMPARISON.md        ← Compare options
│   ├── SECURITY_CHECKLIST.md       ← Security audit
│   ├── TESTING_GUIDE.md            ← How to test
│   └── DEPLOYMENT_GUIDE.md         ← How to deploy
├── frontend/
│   └── src/
│       └── components/
│           └── MultiSigWallet.tsx  ← React UI
├── hardhat.config.js               ← Hardhat setup
├── .env.example                    ← Config template
├── MULTISIG_README.md              ← Main guide
└── IMPLEMENTATION_SUMMARY.md       ← This summary
```

## Deployment Architecture

```
Developer Machine
       │
       │ 1. Configure .env
       │ 2. Run deploy script
       ▼
┌─────────────────┐
│ Hardhat         │
│ - Compile       │
│ - Validate      │
│ - Deploy        │
└────────┬────────┘
         │
         │ 3. Deploy transaction
         ▼
┌──────────────────────────┐
│ Base Sepolia / Mainnet   │
│ - Contract deployed      │
│ - Address: 0x...         │
└────────┬─────────────────┘
         │
         │ 4. Verify contract
         ▼
┌──────────────────────────┐
│ Basescan                 │
│ - Source code verified   │
│ - Public interface       │
└────────┬─────────────────┘
         │
         │ 5. Use contract
         ▼
┌──────────────────────────┐
│ Frontend / Owners        │
│ - Connect wallets        │
│ - Manage funds           │
│ - Execute transactions   │
└──────────────────────────┘
```

## Gas Cost Breakdown

```
┌────────────────────────────────────────────┐
│ Operation          │ Gas     │ Cost @50gwei│
├────────────────────┼─────────┼─────────────┤
│ Deploy             │ 2.0M    │ ~$200       │
│ Add Owner (prop.)  │ 150K    │ ~$15        │
│ Add Owner (conf.)  │ 80K     │ ~$8         │
│ Execute (< limit)  │ 100K    │ ~$10        │
│ Execute (> limit)  │ 150K    │ ~$15        │
│ Confirm Tx         │ 80K     │ ~$8         │
│ Revoke Confirm     │ 60K     │ ~$6         │
└────────────────────────────────────────────┘

Example: 2-of-3 transaction above limit
┌─────────────────────────────────────┐
│ Owner 1: Execute       150K = $15   │
│ Owner 2: Confirm        80K = $8    │
│ Total                  230K = $23   │
└─────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────┐
│              Defense Layers                 │
├─────────────────────────────────────────────┤
│ Layer 1: Access Control                     │
│ - onlyOwner modifier                        │
│ - ownerExists checks                        │
│ - validRequirement checks                   │
├─────────────────────────────────────────────┤
│ Layer 2: Reentrancy Protection              │
│ - noReentrant modifier                      │
│ - locked state variable                     │
├─────────────────────────────────────────────┤
│ Layer 3: Integer Safety                     │
│ - Solidity 0.8.20 (built-in)               │
│ - Explicit overflow checks                  │
├─────────────────────────────────────────────┤
│ Layer 4: State Consistency                  │
│ - Clear pending on owner changes            │
│ - Proper index management                   │
│ - Event emission                            │
├─────────────────────────────────────────────┤
│ Layer 5: Input Validation                   │
│ - Zero address checks                       │
│ - Duplicate prevention                      │
│ - Requirement bounds                        │
└─────────────────────────────────────────────┘
```

## Legend

```
✅ - Implemented and working
⏳ - Pending/Waiting
✗ - Failed/Not allowed
▼ - Flow direction
│ - Connection
├─ - Branch
└─ - End branch
```
