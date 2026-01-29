# MultiSig Wallet Implementation

A comprehensive multi-signature wallet implementation with daily spending limits, built with Solidity ^0.8.20 and modern web technologies.

## 📋 Overview

This implementation provides a secure, gas-efficient multi-signature wallet that requires multiple owner confirmations for transactions above a configurable daily limit. Small transactions can be executed immediately by any owner, while larger transactions require N-of-M owner approvals.

## ✨ Features

### Smart Contract
- **Multi-Signature Approval**: Requires N-of-M owner confirmations
- **Daily Spending Limit**: Single-owner transactions within daily allowance
- **Gas-Efficient**: Bitmap-based confirmation tracking
- **Owner Management**: Add, remove, or change owners with multi-sig
- **Reentrancy Protection**: Secure external call handling
- **Configurable**: Adjust required confirmations and daily limits
- **Event Logging**: Comprehensive event system for monitoring

### Frontend (React + TypeScript)
- **Wallet Connection**: MetaMask, WalletConnect support
- **Transaction Management**: Propose, confirm, and revoke transactions
- **Owner Dashboard**: View owners and permissions
- **Real-time Updates**: Live transaction status
- **Responsive Design**: Mobile-friendly interface

## 🏗️ Architecture

### Confirmation Mechanism
Uses an innovative **bitmap-based confirmation system**:
- Each owner has a unique bit position (2^index)
- All confirmations stored in a single uint256
- Supports up to 250 owners
- O(1) confirmation checks

### Daily Limit System
- Automatic 24-hour rolling window
- Tracks spending per day
- Overflow protection
- Can be adjusted via multi-sig

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## 📦 Installation

### Prerequisites
- Node.js >= 18.20.3
- Yarn 3.5.0

### Install Dependencies

```bash
# Install all dependencies
yarn install

# Or use npm
npm install hardhat @nomicfoundation/hardhat-toolbox dotenv
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Deployment Private Key
PRIVATE_KEY=your_private_key_here

# RPC URLs
BASE_RPC_URL=https://mainnet.base.org
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Basescan API Key for contract verification
BASESCAN_API_KEY=your_basescan_api_key_here

# MultiSig Wallet Configuration
MULTISIG_OWNERS=0xAddress1,0xAddress2,0xAddress3
MULTISIG_REQUIRED=2
MULTISIG_DAILY_LIMIT=1000000000000000000  # 1 ETH in wei
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
yarn test:multisig

# Or with npx
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### Test Coverage

The test suite includes:
- ✅ Deployment tests
- ✅ Owner management tests
- ✅ Transaction execution tests
- ✅ Confirmation system tests
- ✅ Security tests (reentrancy, access control)
- ✅ Configuration tests

## 🚀 Deployment

### Deploy to Base Sepolia (Testnet)

```bash
# Set environment variables in .env
yarn deploy:multisig:baseSepolia

# Or with npx
npx hardhat run scripts/deploy.js --network baseSepolia
```

### Deploy to Base Mainnet

```bash
# Make sure to use a secure private key management solution
yarn deploy:multisig --network base

# Or with npx
npx hardhat run scripts/deploy.js --network base
```

### Deployment Output

The deployment script will:
1. Validate all parameters
2. Deploy the MultiSigWallet contract
3. Verify initial state
4. Submit for verification on Basescan
5. Output deployment information

Example output:
```
MultiSigWallet deployed to: 0x123...
- Number of owners: 3
- Required confirmations: 2
- Daily limit: 1.0 ETH
```

## 📝 Usage

### Smart Contract Interaction

#### Execute Transaction

```solidity
// Execute transaction (auto-determines if multi-sig needed)
bytes32 operationHash = wallet.execute(
    recipientAddress,
    1 ether,
    "0x"  // data
);
```

#### Confirm Transaction

```solidity
// Confirm pending transaction
wallet.confirm(operationHash);
```

#### Revoke Confirmation

```solidity
// Revoke your confirmation
wallet.revoke(operationHash);
```

### Frontend Integration

```typescript
import MultiSigWallet from './frontend/src/components/MultiSigWallet';

function App() {
  return (
    <MultiSigWallet 
      contractAddress="0x123..." 
    />
  );
}
```

## 📚 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: Detailed contract architecture and design decisions
- **[CRYPTOGRAPHY.md](docs/CRYPTOGRAPHY.md)**: Explanation of operation hashing and bitmap confirmations
- **[WALLET_COMPARISON.md](docs/WALLET_COMPARISON.md)**: Comparison with other wallet solutions (MPC, Gnosis Safe, etc.)
- **[SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md)**: Security audit checklist and recommendations

## 🔒 Security

### Implemented Protections

- ✅ Reentrancy guard on external calls
- ✅ Integer overflow protection (Solidity 0.8.x)
- ✅ Owner limit enforcement (max 250)
- ✅ Access control on all sensitive functions
- ✅ Proper event logging for transparency

### Recommendations

1. **Audit**: Professional security audit before mainnet deployment
2. **Testing**: Start with testnet and small amounts
3. **Key Management**: Use hardware wallets for owner keys
4. **Monitoring**: Watch for unexpected transactions
5. **Recovery Plan**: Document emergency procedures

See [docs/SECURITY_CHECKLIST.md](docs/SECURITY_CHECKLIST.md) for complete security analysis.

## 🎯 Use Cases

- **DAO Treasuries**: Multi-sig control for organization funds
- **Company Wallets**: Shared business accounts with spending limits
- **Family Funds**: Joint accounts with multiple signers
- **Custody Solutions**: Secure multi-party custody
- **Investment Groups**: Shared investment pools

## 🔄 Comparison with Alternatives

| Feature | This Implementation | Gnosis Safe | MPC Wallets |
|---------|---------------------|-------------|-------------|
| Gas Cost | Medium | Medium | Low |
| Transparency | High | High | Low |
| Daily Limit | ✅ | Via Module | ❌ |
| Complexity | Low | Medium | High |
| On-Chain | ✅ | ✅ | Partially |

See [docs/WALLET_COMPARISON.md](docs/WALLET_COMPARISON.md) for detailed comparison.

## 🛠️ Development

### Project Structure

```
.
├── contracts/
│   └── MultiSigWallet.sol          # Main contract
├── test/
│   └── MultiSigWallet.test.js      # Test suite
├── scripts/
│   └── deploy.js                    # Deployment script
├── frontend/
│   └── src/
│       └── components/
│           └── MultiSigWallet.tsx   # React component
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CRYPTOGRAPHY.md
│   ├── WALLET_COMPARISON.md
│   └── SECURITY_CHECKLIST.md
├── hardhat.config.js                # Hardhat configuration
└── .env.example                     # Environment template
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Local Node

```bash
npx hardhat node
```

### Clean Build Artifacts

```bash
npx hardhat clean
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

Apache-2.0 License - see LICENSE.md for details

## 🔗 Resources

- **Base Documentation**: https://docs.base.org/
- **Hardhat Documentation**: https://hardhat.org/docs
- **Solidity Documentation**: https://docs.soliditylang.org/
- **OpenZeppelin**: https://docs.openzeppelin.com/

## ⚠️ Disclaimer

This software is provided "as is", without warranty of any kind. Use at your own risk. Always conduct thorough testing and obtain professional security audits before deploying to mainnet with real funds.

## 📧 Support

For questions and support:
- Open an issue on GitHub
- Join the Base Discord: https://base.org/discord
- Read the documentation in the `docs/` directory

---

Built with ❤️ for the Base ecosystem
