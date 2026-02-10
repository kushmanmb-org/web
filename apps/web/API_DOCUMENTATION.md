# Base.org Web API Documentation

This document describes the OpenAPI 3.0 specification for the Base.org Web API.

## Overview

The Base.org Web API provides endpoints for:
- **Basenames**: ENS-like domain naming system for Base
- **Proof Verification**: Discount and eligibility verification for Basenames registration
- **Registry**: Content registry management
- **Mining Statistics**: Bitcoin mining reward data
- **NFT**: NFT proof verification
- **Blockchain**: Block and transaction data
- **Authentication**: User authentication endpoints
- **Farcaster**: Farcaster social network integration

## OpenAPI Specification

The OpenAPI 3.0 specification is located at:
```
apps/web/openapi.yaml
```

## Using the API Documentation

### Viewing the API Documentation

You can view and interact with the API documentation using various tools:

#### 1. Swagger UI (Online)
Upload the `openapi.yaml` file to [Swagger Editor](https://editor.swagger.io/) to view and test the API.

#### 2. Swagger UI (Local)
Run Swagger UI locally with Docker:

```bash
docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v $(pwd)/apps/web/openapi.yaml:/openapi.yaml swaggerapi/swagger-ui
```

Then open http://localhost:8080 in your browser.

#### 3. Redoc (Local)
Run Redoc locally with Docker:

```bash
docker run -p 8080:80 -e SPEC_URL=openapi.yaml -v $(pwd)/apps/web/openapi.yaml:/usr/share/nginx/html/openapi.yaml redocly/redoc
```

Then open http://localhost:8080 in your browser.

#### 4. VS Code Extension
Install the "OpenAPI (Swagger) Editor" extension in VS Code to view and edit the specification with autocomplete and validation.

### Generating API Clients

You can generate API clients in various languages using [OpenAPI Generator](https://openapi-generator.tech/):

#### TypeScript/JavaScript Client
```bash
npx @openapitools/openapi-generator-cli generate \
  -i apps/web/openapi.yaml \
  -g typescript-fetch \
  -o ./generated-client/typescript
```

#### Python Client
```bash
npx @openapitools/openapi-generator-cli generate \
  -i apps/web/openapi.yaml \
  -g python \
  -o ./generated-client/python
```

#### Go Client
```bash
npx @openapitools/openapi-generator-cli generate \
  -i apps/web/openapi.yaml \
  -g go \
  -o ./generated-client/go
```

### Validating the OpenAPI Spec

You can validate the OpenAPI specification using:

```bash
npx @stoplight/spectral-cli lint apps/web/openapi.yaml
```

Or using swagger-cli:

```bash
npx swagger-cli validate apps/web/openapi.yaml
```

## API Endpoints Summary

### Core APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mining/reward-stats` | GET | Get Bitcoin mining reward statistics |
| `/api/block/{blockHash}/txs` | GET | Get transactions for a block |
| `/api/_health` | GET | Health check endpoint |
| `/api/cloudinaryUrl` | POST | Get Cloudinary upload URL |
| `/api/registry/entries` | GET | Get registry entries with pagination |
| `/api/registry/featured` | GET | Get featured registry entries |
| `/api/auth` | GET | Authentication challenge |
| `/api/auth/register` | POST | Register new user |
| `/api/checkNftProof` | POST | Verify NFT ownership proof |

### Basenames APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/basenames/getUsernames` | GET | Get usernames for an address |
| `/api/basenames/{name}/assets/cardImage.svg` | GET | Get Basename card image |
| `/api/basenames/avatar/ipfsUpload` | POST | Upload avatar to IPFS |
| `/api/basenames/talentprotocol/{address}` | GET | Get Talent Protocol data |
| `/api/basenames/metadata/{tokenId}` | GET | Get Basename NFT metadata |
| `/api/basenames/contract-uri` | GET | Get contract URI |
| `/api/basenames/contract-uri.json` | GET | Get contract metadata JSON |

### Proofs APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/proofs/discountCode` | POST | Verify discount code |
| `/api/proofs/discountCode/consume` | POST | Consume discount code |
| `/api/proofs/bns` | GET | Get BNS proof |
| `/api/proofs/baseEthHolders` | GET | Get Base ETH holder proof |
| `/api/proofs/cb1` | GET | Get CB1 proof |
| `/api/proofs/coinbase` | GET | Get Coinbase verified account proof |
| `/api/proofs/cbid` | GET | Get CBID proof |

### Other APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/proxy` | GET/POST | Proxy requests to external services |
| `/farcaster/user` | GET | Get Farcaster user information |

## Authentication

The API supports two authentication methods:

1. **Bearer Token (JWT)**: Include in Authorization header
   ```
   Authorization: Bearer <your-jwt-token>
   ```

2. **Basic Auth**: Username and password authentication
   ```
   Authorization: Basic <base64-encoded-credentials>
   ```

## Rate Limiting

Rate limiting details are not currently specified in the API. Please refer to the Base.org terms of service for usage limits.

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

Common HTTP status codes:
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Authentication required
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource conflict (e.g., already claimed)
- `500`: Internal Server Error

## Private API Documentation

If you need to maintain a private version of the API documentation with sensitive information (API keys, internal endpoints, etc.), create a file named `openapi.private.yaml`. This file is automatically excluded by `.gitignore`.

## Contributing

When adding new API endpoints:

1. Add the endpoint definition to `openapi.yaml`
2. Include request/response schemas
3. Document all parameters and responses
4. Add examples where helpful
5. Test the specification using a validator

## Support

For API support and questions, please visit:
- Website: https://base.org
- Documentation: https://docs.base.org
- GitHub: https://github.com/base-org/web

## License

Apache 2.0 - See [LICENSE.md](../../LICENSE.md) for details.
