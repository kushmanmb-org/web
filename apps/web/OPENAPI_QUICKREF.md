# OpenAPI 3.0 Quick Reference

## Files Created/Modified

### New Files
1. **apps/web/openapi.yaml** (1,284 lines)
   - Complete OpenAPI 3.0 specification
   - Documents 25+ API endpoints
   - Includes all schemas and authentication

2. **apps/web/API_DOCUMENTATION.md** (202 lines)
   - User guide for the OpenAPI specification
   - Instructions for viewing and generating clients
   - Endpoint reference table

3. **This file** (Quick reference)

### Modified Files
1. **.gitignore**
   - Added protection for private API documentation
   - Excludes: openapi.private.*, api-docs-private.*, swagger-private.*

2. **GitHub Actions Workflows** (6 files)
   - All workflows now use `[self-hosted, linux]` runners
   - Files: main.yml, node.js.yml, e2e-tests.yml, bearer.yml, file-size-checker.yml, update-algolia.yml

## Quick Commands

### View API Documentation
```bash
# Swagger UI (Docker)
docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml \
  -v $(pwd)/apps/web/openapi.yaml:/openapi.yaml \
  swaggerapi/swagger-ui

# Open http://localhost:8080
```

### Validate OpenAPI Spec
```bash
npx swagger-cli validate apps/web/openapi.yaml
```

### Generate TypeScript Client
```bash
npx @openapitools/openapi-generator-cli generate \
  -i apps/web/openapi.yaml \
  -g typescript-fetch \
  -o ./generated-client/typescript
```

## API Endpoint Categories

| Category | Endpoints | Description |
|----------|-----------|-------------|
| Mining | 1 | Bitcoin mining statistics |
| Block | 1 | Blockchain data |
| Health | 1 | Service health checks |
| Registry | 2 | Content registry |
| Auth | 2 | Authentication |
| NFT | 1 | NFT verification |
| Basenames | 7 | Domain naming system |
| Proofs | 7 | Discount proofs |
| Proxy | 2 | External proxying |
| Farcaster | 1 | Social integration |
| Media | 1 | Media processing |

**Total: 26 endpoints**

## Key Features

✅ OpenAPI 3.0.3 compliant
✅ Complete request/response schemas
✅ Authentication schemes (Bearer + Basic)
✅ Server configurations (prod + dev)
✅ Validated with swagger-cli and spectral
✅ Security-scanned with CodeQL
✅ Code-reviewed with no issues

## Self-Hosted Runners

All GitHub Actions workflows now use self-hosted Linux runners for:
- Better performance
- Cost efficiency
- Custom environment control
- Private infrastructure

## Private Documentation

To create a private version with sensitive data:
```bash
cp apps/web/openapi.yaml apps/web/openapi.private.yaml
# Edit openapi.private.yaml with sensitive information
# This file is automatically excluded by .gitignore
```

## Support

- Main documentation: `apps/web/API_DOCUMENTATION.md`
- OpenAPI spec: `apps/web/openapi.yaml`
- Base.org: https://base.org
- Docs: https://docs.base.org
