# Contract Source Code API

This feature adds support for fetching verified contract source code from blockchain explorers (Etherscan and Basescan).

## Overview

The proxy API route has been extended to support retrieving contract source code verification data from Etherscan-compatible APIs. This allows you to fetch:

- Smart contract source code
- Contract ABI (Application Binary Interface)
- Compiler version and settings
- Verification metadata (license, optimization, etc.)

## API Endpoints

### Fetch from Etherscan (Ethereum Mainnet)

```
GET /api/proxy?apiType=etherscan-sourcecode&address={contractAddress}
```

### Fetch from Basescan (Base Mainnet)

```
GET /api/proxy?apiType=basescan-sourcecode&address={contractAddress}
```

## Parameters

- `apiType`: Must be either `etherscan-sourcecode` or `basescan-sourcecode`
- `address`: The Ethereum address of the verified contract (must be a valid Ethereum address)

## Response Format

The API returns data in the Etherscan API format:

```typescript
{
  status: "1",              // "1" for success, "0" for error
  message: "OK",            // Status message
  result: [
    {
      SourceCode: string,          // The Solidity source code
      ABI: string,                 // JSON string of the contract ABI
      ContractName: string,        // Name of the contract
      CompilerVersion: string,     // Solidity compiler version used
      CompilerType: string,        // Compiler type (e.g., "solc")
      OptimizationUsed: string,    // "1" if optimization was used, "0" otherwise
      Runs: string,                // Number of optimization runs
      ConstructorArguments: string,// Constructor arguments if any
      EVMVersion: string,          // EVM version used
      Library: string,             // External libraries used
      ContractFileName: string,    // Original contract file name
      LicenseType: string,         // License type (e.g., "MIT", "None")
      Proxy: string,               // "1" if it's a proxy contract
      Implementation: string,      // Implementation address if proxy
      SwarmSource: string,         // Swarm hash
      SimilarMatch: string         // Similar contract address if found
    }
  ]
}
```

## Example Usage

See `examples/contract-source-code-api.ts` for a complete example.

### Basic Usage

```typescript
import { ContractSourceCodeResponse } from '../src/types/ContractSourceCode';

async function getContractSource(address: string) {
  const response = await fetch(
    `/api/proxy?apiType=basescan-sourcecode&address=${address}`
  );
  const data = await response.json();
  const contractData = data.data as ContractSourceCodeResponse;
  
  if (contractData.status === '1' && contractData.result.length > 0) {
    const contract = contractData.result[0];
    console.log('Contract:', contract.ContractName);
    console.log('Source:', contract.SourceCode);
    console.log('ABI:', JSON.parse(contract.ABI));
  }
}
```

## Test Contract Example

The implementation was tested with the Test12345 contract from the problem statement:

```solidity
pragma solidity 0.4.26;

contract Test12345 {
    string public test;
    
    function enterValue(string _c) {
        test = _c;
    }
}
```

## Environment Variables

The API requires the `ETHERSCAN_API_KEY` environment variable to be set. This key is used for both Etherscan and Basescan API calls.

## Type Safety

TypeScript types are provided in `src/types/ContractSourceCode.ts` for type-safe usage of the API response.

## Use Cases

- Display verified contract source code on a contract details page
- Verify contract bytecode matches source code
- Extract contract ABI for interaction
- Check contract verification status
- Compare implementations of similar contracts
