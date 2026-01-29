# MultiSig Wallet Deployment Guide

## Prerequisites

Before deploying the MultiSigWallet, ensure you have:

1. **Node.js** >= 22.10.0 (LTS)
2. **Hardhat** installed locally
3. **Private key** for deployment (NEVER share this!)
4. **Base Sepolia ETH** for testnet deployment
5. **Base ETH** for mainnet deployment
6. **Basescan API key** for contract verification

## Environment Setup

### 1. Create Environment File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your actual values:

```bash
# REQUIRED: Your deployment wallet private key
# ⚠️ NEVER commit this file to git!
PRIVATE_KEY=0xYourPrivateKeyHere

# REQUIRED: RPC URLs (can use defaults)
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# REQUIRED: For contract verification on Basescan
BASESCAN_API_KEY=YourBasescanApiKeyHere

# REQUIRED: Wallet configuration
# Comma-separated list of owner addresses
MULTISIG_OWNERS=0xOwner1Address,0xOwner2Address,0xOwner3Address

# REQUIRED: Number of confirmations needed (must be <= number of owners)
MULTISIG_REQUIRED=2

# REQUIRED: Daily spending limit in wei (example: 1 ETH = 1000000000000000000)
MULTISIG_DAILY_LIMIT=1000000000000000000
```

### 3. Validate Configuration

**Owner Addresses:**
- Must be valid Ethereum addresses (start with 0x)
- No duplicates allowed
- Cannot be zero address (0x0000...)
- At least 1 owner required
- Maximum 250 owners

**Required Confirmations:**
- Must be >= 1
- Must be <= number of owners
- Common configurations:
  - 2-of-3: Good balance of security and usability
  - 3-of-5: Higher security for larger amounts
  - 1-of-1: Single owner (not recommended)

**Daily Limit:**
- In wei (1 ETH = 1000000000000000000 wei)
- Set to 0 to require multi-sig for all transactions
- Recommended: 1-10 ETH for operational expenses

## Deployment Process

### Step 1: Test Compilation

```bash
# Compile contracts to check for errors
npx hardhat compile
```

**Expected output:**
```
Compiling 1 file with 0.8.20
Solidity compilation finished successfully
```

### Step 2: Run Tests

```bash
# Run full test suite
npx hardhat test
```

**Expected output:**
```
  32 passing (5s)
```

### Step 3: Deploy to Testnet (Base Sepolia)

```bash
# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia

# Or use the npm script
yarn deploy:multisig:baseSepolia
```

**Expected output:**
```
Starting MultiSigWallet deployment...

Deployment parameters:
- Owners: [ '0x...', '0x...', '0x...' ]
- Required confirmations: 2
- Daily limit: 1.0 ETH

Deploying MultiSigWallet...
MultiSigWallet deployed to: 0x1234567890123456789012345678901234567890

Verifying deployment...
- Number of owners: 3
- Required confirmations: 2
- Daily limit: 1.0 ETH

Deployment Info:
{
  "address": "0x1234567890123456789012345678901234567890",
  "network": "baseSepolia",
  "owners": [...],
  "required": 2,
  "dailyLimit": "1000000000000000000",
  "timestamp": "2024-01-...",
  "blockNumber": 123456
}

Waiting for block confirmations...
Verifying contract on block explorer...
Contract verified successfully!

✅ Deployment completed successfully!

Next steps:
1. Fund the wallet by sending ETH to: 0x1234567890123456789012345678901234567890
2. Test the wallet with a small transaction
3. Configure frontend with the contract address
```

### Step 4: Verify on Basescan

The deployment script automatically verifies the contract. If verification fails:

```bash
# Manual verification
npx hardhat verify --network baseSepolia \
  DEPLOYED_ADDRESS \
  '["0xOwner1","0xOwner2","0xOwner3"]' \
  2 \
  "1000000000000000000"
```

### Step 5: Test on Testnet

1. **View on Basescan:**
   - Visit: https://sepolia.basescan.org/address/YOUR_ADDRESS
   - Check: Contract is verified ✓
   - Check: Source code is visible ✓

2. **Fund the wallet:**
   ```bash
   # Send some test ETH
   # Use MetaMask or another wallet to send to the contract address
   ```

3. **Test a transaction:**
   - Connect to the contract using MetaMask
   - Execute a small transaction
   - Verify multi-sig requirements work

## Mainnet Deployment

### ⚠️ Security Checklist

Before deploying to mainnet, ensure:

- [ ] Contract has been audited by a professional security firm
- [ ] All tests pass successfully
- [ ] Testnet deployment tested thoroughly
- [ ] Owner addresses verified (use hardware wallets)
- [ ] Private keys secured (use hardware wallet or secure key management)
- [ ] Daily limit set appropriately
- [ ] Required confirmations configured correctly
- [ ] Emergency procedures documented
- [ ] Team members trained on usage
- [ ] Monitoring setup in place

### Deploy to Base Mainnet

```bash
# Deploy to Base Mainnet
npx hardhat run scripts/deploy.js --network base

# Or use the npm script
yarn deploy:multisig --network base
```

### Post-Deployment Steps

1. **Verify deployment:**
   - Check on Basescan: https://basescan.org/address/YOUR_ADDRESS
   - Verify all parameters are correct
   - Check owner list

2. **Initial funding:**
   - Start with a small amount (0.1-1 ETH)
   - Test with a transaction
   - Gradually increase once confidence is established

3. **Test multi-sig:**
   - Execute a transaction above daily limit
   - Verify all owners can confirm
   - Verify threshold works correctly

4. **Document details:**
   - Save contract address
   - Document owner addresses and their holders
   - Record required confirmations
   - Note daily limit
   - Create emergency contact list

5. **Setup monitoring:**
   - Add contract to monitoring service
   - Set up alerts for transactions
   - Monitor owner changes
   - Track daily limit usage

## Network Configurations

### Base Sepolia (Testnet)

- **Chain ID:** 84532
- **RPC URL:** https://sepolia.base.org
- **Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

### Base Mainnet

- **Chain ID:** 8453
- **RPC URL:** https://mainnet.base.org
- **Explorer:** https://basescan.org

## Deployment Costs

Estimated gas costs (at 1 gwei = $0.002):

| Network | Gas Units | Cost (1 gwei) | Cost (20 gwei) |
|---------|-----------|---------------|----------------|
| Deploy | ~2,000,000 | ~$4 | ~$80 |
| Verify | Free | Free | Free |
| **Total** | | **~$4** | **~$80** |

## Troubleshooting

### Error: "Invalid owner address"

**Cause:** One of the owner addresses is invalid

**Solution:**
```bash
# Check each address
# Valid: 0x1234567890123456789012345678901234567890
# Invalid: 1234567890123456789012345678901234567890 (missing 0x)
```

### Error: "Invalid requirement"

**Cause:** Required confirmations > number of owners or < 1

**Solution:**
```bash
# For 3 owners, required must be 1, 2, or 3
# Edit .env:
MULTISIG_REQUIRED=2  # Must be <= 3
```

### Error: "Duplicate owner"

**Cause:** Same address listed multiple times

**Solution:**
```bash
# Check for duplicates in .env
MULTISIG_OWNERS=0xAddr1,0xAddr2,0xAddr3  # All unique
```

### Error: "Insufficient funds"

**Cause:** Deployment account doesn't have enough ETH

**Solution:**
```bash
# Check balance
# For testnet, use faucet
# For mainnet, fund the deployment account
```

### Error: "Network not supported"

**Cause:** Network configuration missing

**Solution:**
Check `hardhat.config.js` has the network defined.

### Verification Failed

**Solution:**
```bash
# Wait a few minutes, then try manual verification
npx hardhat verify --network baseSepolia DEPLOYED_ADDRESS [CONSTRUCTOR_ARGS]
```

## Security Best Practices

### Before Deployment

1. **Use hardware wallet** for deployment key
2. **Test on testnet first** (always!)
3. **Audit the contract** (professional audit for mainnet)
4. **Verify all addresses** (no typos!)
5. **Document everything** (who owns what)

### During Deployment

1. **Double-check** all parameters
2. **Save all output** from deployment
3. **Verify on explorer** immediately
4. **Test with small amount** first
5. **Confirm multi-sig works** before adding funds

### After Deployment

1. **Distribute owner information** securely
2. **Setup monitoring** and alerts
3. **Document procedures** for common operations
4. **Train all owners** on usage
5. **Regular security reviews**

## Emergency Procedures

### Owner Key Compromised

1. **Immediately** use remaining owners to remove compromised owner
2. Add new owner address
3. Update required confirmations if needed
4. Review all pending transactions

### Suspected Attack

1. **Do not panic** - contract is secure if properly configured
2. Check all pending transactions
3. Revoke suspicious confirmations
4. Contact all owners
5. Consider migrating to new contract if necessary

### Lost Owner Key

1. **Verify** key is truly lost (not just forgotten password)
2. Use remaining owners to remove lost owner
3. Add replacement owner
4. Update documentation

## Mainnet Deployment Checklist

Use this checklist before mainnet deployment:

- [ ] Contract compiled successfully
- [ ] All tests pass (32/32)
- [ ] Security audit completed
- [ ] Testnet deployment successful
- [ ] Testnet functionality verified
- [ ] Owner addresses verified (preferably hardware wallets)
- [ ] Required confirmations set correctly
- [ ] Daily limit appropriate for use case
- [ ] Private keys secured
- [ ] .env file NOT committed to git
- [ ] Deployment script tested
- [ ] Network configuration correct
- [ ] Sufficient ETH for deployment
- [ ] Basescan API key configured
- [ ] Team members notified
- [ ] Emergency procedures documented
- [ ] Monitoring setup ready
- [ ] Frontend integration prepared

## Support

For deployment issues:

1. Check this guide thoroughly
2. Review error messages carefully
3. Check Hardhat documentation
4. Check Base documentation
5. Open GitHub issue with full details

## References

- [Hardhat Deployment](https://hardhat.org/guides/deploying.html)
- [Base Documentation](https://docs.base.org/)
- [Basescan API](https://docs.basescan.org/)
- [Ethereum Address Format](https://ethereum.org/en/developers/docs/accounts/)
