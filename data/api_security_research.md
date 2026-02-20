# Fitness Software API Security Research

## MindBody API Security

**Authentication Requirements:**
- Requires `Api-Key` header for all requests
- Requires `SiteId` header to specify which business to access
- Requires `authorization` header with staff user token
- API keys are self-service managed but require developer account
- Must pass both API key AND site-specific authorisation

**Key Security Features:**
- Multi-layer authentication (API key + Site ID + User Token)
- Site ID required - cannot enumerate other businesses without their specific ID
- OAuth available for user authentication
- HTTPS required for all API calls
- Allowlist functionality available

**Data Isolation:**
- Each request must include the specific SiteId
- Cannot access data without explicit authorisation from business owner
- Business owners must grant activation code/link to developers

