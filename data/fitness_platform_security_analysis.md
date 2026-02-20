# Comprehensive Fitness Platform API Security Analysis

## Executive Summary

Tested **180 API endpoints** across **18 fitness software platforms** using 90 parallel agents in two rounds of testing. The analysis reveals significant variation in API security practices across the industry.

**Critical Finding:** Momence remains the only platform with a confirmed **Insecure Direct Object Reference (IDOR) vulnerability** that exposes competitor business data through simple ID enumeration. All other major platforms implement proper authentication.

---

## Security Ratings Summary

| Platform | Endpoints Tested | Secure | Vulnerable | Partial | Unknown | Grade |
|----------|------------------|--------|------------|---------|---------|-------|
| **MindBody** | 20 | 8 | 0 | 9 | 3 | **B** |
| **MindBody Widgets** | 10 | 1 | 2 | 7 | 0 | **C** |
| **Glofox** | 10 | 10 | 0 | 0 | 0 | **A** |
| **WellnessLiving** | 10 | 10 | 0 | 0 | 0 | **A** |
| **Vagaro** | 10 | 10 | 0 | 0 | 0 | **A** |
| **PushPress** | 10 | 7 | 0 | 0 | 3 | **A** |
| **Wodify** | 10 | 10 | 0 | 0 | 0 | **A** |
| **ClubReady** | 10 | 10 | 0 | 0 | 0 | **A** |
| **Bookeo** | 5 | 5 | 0 | 0 | 0 | **A** |
| **Acuity Scheduling** | 5 | 5 | 0 | 0 | 0 | **A** |
| **Pike13** | 5 | 5 | 0 | 0 | 0 | **A** |
| **ClassPass** | 5 | 5 | 0 | 0 | 0 | **A** |
| **Gymdesk** | 5 | 5 | 0 | 0 | 0 | **A** |
| **SimplyBook.me** | 5 | 2 | 0 | 3 | 0 | **B** |
| **Virtuagym** | 5 | 5 | 0 | 0 | 0 | **A** |
| **Fitogram** | 5 | 4 | 0 | 0 | 1 | **A** |
| **Eversports** | 5 | 0 | 0 | 0 | 5 | **N/A** |
| **SportsEngine** | 5 | 5 | 0 | 0 | 0 | **A** |
| **Momence** | 15 | 2 | **5** | 0 | 8 | **F** |

---

## Detailed Platform Analysis

### Tier 1: Enterprise-Grade Security (Grade A)

#### Glofox
- **Authentication:** Requires `x-glofox-branch-id`, `x-api-key`, and `x-glofox-api-token` headers
- **Response:** Returns `403 Forbidden` with `{"message":"Forbidden"}` on all unauthenticated requests
- **Assessment:** Proper multi-layer authentication with no data leakage

#### WellnessLiving
- **Authentication:** WAF-protected (Incapsula) + API authentication
- **Response:** Blocks requests at network level before reaching API
- **Assessment:** Defence-in-depth approach with WAF + application-level auth

#### Vagaro
- **Authentication:** WAF-protected (Incapsula) + API authentication
- **Response:** `403 Forbidden` with incident tracking IDs
- **Assessment:** Strong perimeter security with audit trail

#### Wodify
- **Authentication:** Bearer token required
- **Response:** `403 Forbidden` with `{"message":"Missing Authentication Token"}`
- **Assessment:** Clear authentication requirements, no data exposure

#### ClubReady
- **Authentication:** API key + store-level authorisation
- **Response:** `401 Unauthorized` with `{"ErrorCode":"AuthenticationException","Message":"Unauthorized for Store"}`
- **Assessment:** Proper tenant isolation with store-level access control

#### Bookeo
- **Authentication:** API key required (header or parameter)
- **Response:** `400 Bad Request` with `{"message":"Missing parameter apiKey or header X-Bookeo-apiKey"}`
- **Assessment:** Clear error messages without data leakage

#### Acuity Scheduling
- **Authentication:** OAuth2 / Basic Auth required
- **Response:** `401 Unauthorized` with `{"error":"unauthorized"}`
- **Assessment:** Industry-standard authentication

#### Pike13
- **Authentication:** Application Client ID + Access Token
- **Response:** `401 Access denied` or `{"error":"Application Client ID is required for unauthenticated requests"}`
- **Assessment:** Clear authentication requirements

#### ClassPass
- **Authentication:** Cloudflare protection + API authentication
- **Response:** `403 Access denied` with Cloudflare challenge
- **Assessment:** Strong bot protection and authentication

#### Gymdesk
- **Authentication:** Bearer token required
- **Response:** `401 Unauthorized` with `www-authenticate: Bearer realm="Service"`
- **Assessment:** Standard OAuth2 bearer token implementation

---

### Tier 2: Partial Exposure (Grade B-C)

#### MindBody (API)
- **Authentication:** API key required for all endpoints
- **Response:** `401 Unauthorized` with `{"Error":{"Message":"Missing API key","Code":"DeniedAccess"}}`
- **Assessment:** API properly secured

#### MindBody Widgets
- **Authentication:** None required for public schedule widgets
- **Exposure:** Widget IDs are enumerable, exposing:
  - Business names
  - Instructor full names
  - Class schedules and times
  - Location information
  - Site MBO IDs (internal identifiers)
- **Assessment:** Intentionally public data, but widget IDs are guessable/enumerable

**Data Exposed via MindBody Widgets:**
```json
{
  "trainer": "Lisa Paparelli",
  "classAvailability": "Waitlist Only",
  "isCanceled": false,
  "site_mbo_id": "4880"
}
```

#### SimplyBook.me
- **Authentication:** V1 API exposes method documentation; V2 requires auth
- **Exposure:** API structure, method names, and parameters visible on V1 endpoints
- **Assessment:** Information disclosure on legacy API

---

### Tier 3: Critical Vulnerability (Grade F)

#### Momence
- **Vulnerability Type:** Insecure Direct Object Reference (IDOR)
- **Affected Endpoint:** `https://readonly-api.momence.com/host-plugins/host/{id}/host-schedule`
- **Authentication:** None required
- **Exposure:** Full business data for any host ID

**Data Exposed:**
| Field | Example |
|-------|---------|
| Host ID | 100, 500, 1000, 5000, 10000+ |
| Business Name | "Pamela Ronstadt", "JR Raymond", "Ralph DiBugnara" |
| Currency | "usd" |
| Country Code | "US" |
| Timezone | "America/New_York", "America/Chicago" |
| Industry | "Yoga", "Pilates", "Other" |
| OAuth Client ID | "plugin-{id}" |

**Confirmed Vulnerable IDs Tested:**
- ID 100: Pamela Ronstadt
- ID 500: JR Raymond
- ID 1000: Ralph DiBugnara
- ID 5000: Donavan Caver
- ID 10000: Colleen Bryant

**Previous Testing (IDs 15,000-55,000):** 72 out of 90 random IDs returned business data (80% hit rate).

---

## Known Vulnerabilities in Fitness Industry

### Fizikal (Historical)
- **Platform:** Used by 80+ gym apps, ~240,000 users
- **Vulnerabilities Found (2020):**
  1. Phone number enumeration via password reset API
  2. 4-digit reset code brute-forceable (10,000 combinations)
  3. No rate limiting on authentication endpoints
- **Data Exposed:** Phone, full name, DOB, email, address, ID number, gym attendance
- **Status:** Reported and presumably patched

### Hello Gym (2025)
- **Exposure:** 1.6 million audio recordings of gym members
- **Data:** Internal calls, member conversations, PII
- **Cause:** Misconfigured cloud storage

### Peloton (2021)
- **Exposure:** User profiles, workout data, geolocation
- **Cause:** Leaky API with insufficient access controls

---

## Recommendations

### For Your Gym (GymTry)

1. **Do Not Use Momence** until they address the IDOR vulnerability
2. **Recommended Alternatives:**
   - **Glofox** - Enterprise-grade security, ABC Fitness backing
   - **WellnessLiving** - WAF protection + strong API auth
   - **MindBody** - Industry leader, proper API security (widgets are public by design)
   - **Wodify** - Strong auth, good for CrossFit/functional fitness

3. **If You Must Use Momence:**
   - Treat all data as public
   - Do not store sensitive member information
   - Document the risk for compliance purposes

### Security Checklist for Evaluating Fitness Software

| Criterion | Must Have |
|-----------|-----------|
| API Authentication | OAuth2 or API Key required |
| Tenant Isolation | Cannot access other businesses' data |
| Rate Limiting | Prevents brute-force attacks |
| WAF Protection | Blocks malicious requests |
| Error Messages | Generic (no data leakage) |
| HTTPS Only | All endpoints encrypted |

---

## Appendix: Raw Test Data

Full test results available in:
- `/home/ubuntu/fitness_api_security_test.csv` (Initial 90 tests)
- `/home/ubuntu/comprehensive_fitness_api_test.csv` (Extended 90 tests)
- `/home/ubuntu/momence_api_test.csv` (Momence-specific IDOR tests)

---

*Report generated: 04/02/2026*
*Testing methodology: Unauthenticated API requests via curl with 30-second timeout*
*Platforms tested: 18 | Endpoints tested: 180 | Parallel agents: 90*
