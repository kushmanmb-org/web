# MultiSig Wallet Testing Guide

## Prerequisites

Before running tests, ensure you have:

1. **Node.js** version >= 22.10.0 (LTS)
   - Check version: `node --version`
   - Install from: https://nodejs.org/

2. **Yarn** 3.5.0 or npm
   - Check version: `yarn --version`
   - Enable Yarn: `corepack enable`

## Installation

### Step 1: Install Dependencies

Due to the monorepo structure, you need to install Hardhat dependencies separately:

```bash
# Navigate to project root
cd /home/runner/work/web/web

# Install Hardhat and testing dependencies
yarn add -D hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-network-helpers dotenv

# Or using npm (with legacy peer deps to handle monorepo conflicts)
npm install --save-dev --legacy-peer-deps hardhat @nomicfoundation/hardhat-toolbox @nomicfoundation/hardhat-network-helpers dotenv
```

### Step 2: Verify Installation

```bash
# Check Hardhat version
npx hardhat --version

# Should output: 2.19.4 or similar
```

## Running Tests

### Full Test Suite

```bash
# Run all tests
npx hardhat test

# Or use the npm script
yarn test:multisig
```

### Specific Test File

```bash
# Run only MultiSigWallet tests
npx hardhat test test/MultiSigWallet.test.js
```

### With Gas Reporting

```bash
# Enable gas reporting
REPORT_GAS=true npx hardhat test
```

### With Coverage

```bash
# Install coverage plugin
npm install --save-dev solidity-coverage

# Run coverage
npx hardhat coverage
```

### Verbose Output

```bash
# Show detailed test output
npx hardhat test --verbose
```

## Test Structure

The test suite covers:

### 1. Deployment Tests
- ✅ Valid initialization with correct parameters
- ✅ Revert on zero owners
- ✅ Revert on invalid requirements (required > owners)
- ✅ Revert on duplicate owners
- ✅ Revert on zero address as owner

### 2. Owner Management Tests
- ✅ Add new owner with multi-sig
- ✅ Remove owner with multi-sig
- ✅ Change owner with multi-sig
- ✅ Prevent duplicate owners
- ✅ Prevent removing owner if breaks requirement
- ✅ Only owners can manage owners

### 3. Transaction Execution Tests
- ✅ Execute within daily limit without multi-sig
- ✅ Require multi-sig above daily limit
- ✅ Daily limit reset after 24 hours
- ✅ Prevent non-owners from executing
- ✅ Reentrancy protection

### 4. Confirmation Tests
- ✅ Owner can confirm transaction
- ✅ Prevent double confirmation
- ✅ Owner can revoke confirmation
- ✅ Execute when threshold reached
- ✅ Multiple confirmations tracked correctly

### 5. Configuration Tests
- ✅ Change required confirmations
- ✅ Set daily limit
- ✅ Reset spent today
- ✅ All configuration changes require multi-sig

### 6. View Function Tests
- ✅ Check owner status
- ✅ Get pending transactions
- ✅ Check confirmation status

### 7. Deposit Tests
- ✅ Accept ether deposits
- ✅ Emit deposit events

## Expected Test Results

When all tests pass, you should see output similar to:

```
  MultiSigWallet
    Deployment
      ✔ Should set the correct owners (XXXms)
      ✔ Should set the correct required confirmations (XXms)
      ✔ Should set the correct daily limit (XXms)
      ✔ Should revert with zero owners (XXms)
      ✔ Should revert with invalid requirement (XXms)
      ✔ Should revert with duplicate owners (XXms)
      ✔ Should revert with zero address as owner (XXms)
    Owner Management
      ✔ Should allow adding a new owner with multi-sig (XXms)
      ✔ Should prevent non-owners from adding owners (XXms)
      ✔ Should prevent adding duplicate owners (XXms)
      ✔ Should allow removing an owner with multi-sig (XXms)
      ✔ Should prevent removing owner if it would break requirement (XXms)
      ✔ Should allow changing an owner with multi-sig (XXms)
    Transaction Execution
      ✔ Should execute transaction within daily limit without multi-sig (XXms)
      ✔ Should require multi-sig for transaction above daily limit (XXms)
      ✔ Should reset daily limit after 24 hours (XXms)
      ✔ Should prevent non-owners from executing transactions (XXms)
      ✔ Should prevent reentrancy attacks (XXms)
    Confirmation Management
      ✔ Should allow owner to confirm transaction (XXms)
      ✔ Should prevent double confirmation from same owner (XXms)
      ✔ Should allow owner to revoke confirmation (XXms)
      ✔ Should execute transaction when threshold is reached (XXms)
    Configuration
      ✔ Should allow changing required confirmations with multi-sig (XXms)
      ✔ Should prevent invalid requirement changes (XXms)
      ✔ Should allow changing daily limit with multi-sig (XXms)
      ✔ Should allow resetting spent today with multi-sig (XXms)
    View Functions
      ✔ Should return correct owner status (XXms)
      ✔ Should return pending transactions (XXms)
      ✔ Should return correct confirmation status (XXms)
    Deposit Functionality
      ✔ Should emit Deposit event when receiving ether (XXms)
      ✔ Should accept ether deposits (XXms)

  32 passing (Xs)
```

## Troubleshooting

### Issue: "Hardhat not found"

**Solution:**
```bash
# Install Hardhat locally
npm install --save-dev hardhat
```

### Issue: "Node version not supported"

**Solution:**
```bash
# Install Node.js 22 LTS
# Visit: https://nodejs.org/
# Or use nvm:
nvm install 22
nvm use 22
```

### Issue: "Module not found: @nomicfoundation/hardhat-toolbox"

**Solution:**
```bash
# Install the toolbox
npm install --save-dev @nomicfoundation/hardhat-toolbox
```

### Issue: "Compilation failed"

**Solution:**
```bash
# Clean and recompile
npx hardhat clean
npx hardhat compile
```

### Issue: "Test timeout"

**Solution:**
Increase timeout in `hardhat.config.js`:
```javascript
mocha: {
  timeout: 100000, // Increase to 100 seconds
}
```

### Issue: "Gas limit exceeded"

This usually means a test is trying to execute a transaction that's too expensive. Check:
1. The daily limit is set appropriately
2. The transaction value is correct
3. The contract has enough balance

## Test Coverage Goals

Target coverage metrics:
- **Statements**: > 95%
- **Branches**: > 90%
- **Functions**: > 95%
- **Lines**: > 95%

Run coverage to check:
```bash
npx hardhat coverage
```

## Integration Testing

For integration testing with a frontend:

1. **Start local node:**
```bash
npx hardhat node
```

2. **Deploy to local network:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. **Note the contract address** and update your frontend configuration

4. **Connect MetaMask** to localhost:8545

5. **Import test accounts** from the hardhat node output

## Continuous Integration

### GitHub Actions Example

```yaml
name: Test MultiSig Wallet

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: npx hardhat test
      - run: npx hardhat coverage
```

## Gas Benchmarks

Expected gas costs (approximate):

| Operation | Gas Cost |
|-----------|----------|
| Deploy contract | ~2,000,000 |
| Add owner | ~150,000 |
| Confirm transaction | ~80,000 |
| Execute within limit | ~100,000 |
| Execute multi-sig | ~150,000 |

Run with `REPORT_GAS=true` to see actual costs.

## Performance Testing

For stress testing:

```javascript
// Add to test file
describe("Stress Tests", function () {
  it("Should handle 100 owners", async function () {
    // Create 100 owners
    // Test operations
  });
  
  it("Should handle 50 pending transactions", async function () {
    // Create 50 pending transactions
    // Confirm and execute
  });
});
```

## Security Testing

### Slither Analysis

```bash
# Install Slither
pip3 install slither-analyzer

# Run analysis
slither contracts/MultiSigWallet.sol
```

### Mythril Analysis

```bash
# Install Mythril
pip3 install mythril

# Run analysis
myth analyze contracts/MultiSigWallet.sol
```

### Echidna Fuzzing

```bash
# Install Echidna
# See: https://github.com/crytic/echidna

# Run fuzzing
echidna-test contracts/MultiSigWallet.sol
```

## Next Steps

After tests pass:

1. ✅ Review test coverage report
2. ✅ Run security analysis tools
3. ✅ Deploy to testnet
4. ✅ Test on testnet with real wallets
5. ✅ Conduct professional audit
6. ✅ Deploy to mainnet

## Support

If tests fail or you encounter issues:

1. Check the error message carefully
2. Ensure all dependencies are installed
3. Verify Node.js version
4. Clean and recompile
5. Check the GitHub issues for similar problems
6. Open a new issue with full error output

## References

- [Hardhat Documentation](https://hardhat.org/docs)
- [Hardhat Network Helpers](https://hardhat.org/hardhat-network-helpers/docs/overview)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)
- [Solidity Testing Best Practices](https://ethereum.org/en/developers/docs/smart-contracts/testing/)
