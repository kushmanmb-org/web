/**
 * Example script demonstrating how to fetch data from Etherscan API v2
 * 
 * This is a minimal example showing the basic fetch pattern.
 * 
 * NOTE: The URL below is a base endpoint and requires query parameters to work:
 * - module: API module (e.g., 'account')
 * - action: API action (e.g., 'txlist', 'txlistinternal')
 * - address: Ethereum address to query
 * - chainid: Chain ID (1 for Ethereum mainnet, 8453 for Base, 84532 for Base Sepolia)
 * - apikey: Your Etherscan API key
 * 
 * Complete URL example:
 *   'https://api.etherscan.io/v2/api?module=account&action=txlist&address=0x...&chainid=1&apikey=YOUR_KEY'
 * 
 * RECOMMENDED: For production use in this application, use the proxy endpoint at /api/proxy
 * which provides:
 * - Secure API key management from environment variables
 * - Enhanced error handling with retry logic
 * - Support for multiple chain IDs (Ethereum mainnet, Base, Base Sepolia)
 * - API keys never exposed to the client
 * 
 * Proxy endpoint usage:
 *   fetch('/api/proxy?apiType=etherscan&address=0x...')
 *   fetch('/api/proxy?apiType=basescan&address=0x...')
 *   fetch('/api/proxy?apiType=base-sepolia&address=0x...')
 *   fetch('/api/proxy?apiType=basescan-internal&address=0x...')
 * 
 * @see apps/web/app/(basenames)/api/proxy/route.ts for proxy implementation
 * @see apps/web/scripts/ETHERSCAN_EXAMPLE.md for detailed documentation
 */

const options = { method: 'GET' };

// This is a minimal example showing the basic structure.
// Add required query parameters for actual use (see comments above).
fetch('https://api.etherscan.io/v2/api', options)
  .then(res => res.json())
  .then(res => console.log(res))
  .catch(err => console.error(err));
