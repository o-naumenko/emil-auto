# Test Steps

## Claims API - Create > createdAt field validation > created claim should have valid createdAt timestamp
- Create claim and validate createdAt
  - POST /claims and check createdAt field
  - Validate createdAt is recent ISO timestamp
- Verify createdAt format is ISO 8601
  - Check ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)

## Claims API - Create > createdAt field validation > createdAt should be sortable chronologically
- Create multiple claims sequentially
  - Create 3 claims with small delay between
- Verify chronological ordering
  - Compare createdAt timestamps
  - Timestamps are in chronological order

## Claims API - Create > createdAt field validation > createdAt should not change on status update
- Create claim
  - Create initial claim
- Update status
  - Update OPEN -> IN_REVIEW
- Verify createdAt unchanged
  - GET claim and compare createdAt
  - createdAt remains immutable after update

## Claims API - Create > creating multiple claims in parallel yields unique ids
- Create N claims in parallel
  - POST /claims x3
- Verify unique ids
  - IDs should be unique

## Claims API - Create > input edge cases > API currently accepts whitespace-only fields (known issue)
- Create claim with whitespace-only policyNumber
  - Current behavior: whitespace passes truthy check
  - ⚠️  Whitespace-only field was accepted (consider adding trim + validation)

## Claims API - Create > input edge cases > very long field values should be handled
- Create claim with long fields
  - Send payload with 1000+ character fields
  - API accepts long fields

## Claims API - Create > invalid JSON yields 400
- POST /claims with malformed JSON
  - Send invalid JSON, expect 400

## Claims API - Create > missing body yields 400
- POST /claims without body
  - Send empty body, expect 400

## Claims API - Create > response content-type should be application/json
- Create claim
  - POST /claims expect 201
- Verify content-type header
  - Response header content-type contains application/json

## Claims API - Create > response schema validation > created claim matches expected schema structure
- Create claim and validate schema
  - POST /claims
- Verify all required fields present
  - Check for required fields per OpenAPI spec
- Verify no extra fields
  - Ensure response contains only expected fields

## Claims API - Create > should create a new claim and retrieve it by id
- Prepare payload
  - Build CreateClaimDto with valid fields
- Create claim via POST /claims
  - Send POST /claims and expect 201
- Validate response body
  - Assert returned fields and OPEN status
- Fetch by id and compare
  - GET /claims/{id} and deep-compare with created

## Claims API - Create > unknown fields in payload should be ignored by the API
- Create with unknown field
  - POST /claims with extra property
- Verify unknown field not returned
  - Response should not contain unknownField

## Claims API - Create > wrong content-type yields 400
- POST /claims with text/plain
  - Send text/plain payload, expect 400

## Claims API - Get > GET non-existent claim returns 404
- GET /claims/{id} with non-existent id
  - Expect 404 for very large id

## Claims API - Get > GET should return application/json content-type
- Prepare payload
  - Build CreateClaimDto with valid fields
- Create a claim for GET validation
  - Create a claim to validate GET headers
- GET /claims/{id} has application/json content-type
  - Verify content-type header contains application/json

## Claims API - Get > path parameter validation > GET with negative ID returns 404
- GET /claims/-1
  - Attempt to get claim with negative ID

## Claims API - Get > path parameter validation > GET with numeric-like ID is parsed leniently
- GET /claims/1.5 is parsed as 1
  - Express parseInt("1.5") = 1 (lenient parsing)
  - API accepts "1.5" as valid ID (parsed to 1)

## Claims API - Get > path parameter validation > GET with zero ID returns 404
- GET /claims/0
  - Attempt to get claim with ID = 0

## Claims API - Get > response schema validation > GET claim response matches schema
- Create claim
  - Create test claim
- GET and validate schema

## Claims API - Get > should get an existing claim by id
- Prepare payload
  - Build CreateClaimDto with valid fields
- Create a claim to read later
  - POST /claims expect 201
- GET /claims/{id} returns 200 with the same claim
  - Fetch by id and compare fields

## Claims API - List > invalid status filter returns 400
- GET /claims?status=INVALID yields 400
  - Use invalid status filter

## Claims API - List > response schema validation > LIST response is array of valid claims
- Create test claim
  - Ensure at least one claim exists
- GET /claims and validate array schema
  - GET list and validate each item

## Claims API - List > should filter list by valid status
- Create claims in OPEN status
  - Create test claims
- Verify list('OPEN') contains only OPEN claims
  - GET /claims?status=OPEN
- Verify list('PAID') contains only PAID claims if any exist
  - GET /claims?status=PAID

## Claims API - List > should return list of claims unfiltered by default
- Prepare payload
  - Build CreateClaimDto with valid fields
- Create a claim to ensure it appears in the list
  - POST /claims expect 201
- GET /claims returns an array that includes created id
  - Verify created id is present in list()

## Claims API - Update > idempotency > updating to current status should be rejected or accepted
- Create claim in OPEN status
  - Create claim
- Update OPEN -> OPEN (same status)
  - Attempt to update to current status
  - API accepts idempotent updates (200)
  - API rejects same-status updates (400)

## Claims API - Update > PATCH 404 handling > should return 404 before validating status field
- Update non-existent claim with invalid status
  - PATCH /claims/99999999 with invalid status - expect 404 not 400

## Claims API - Update > PATCH 404 handling > should return 404 when updating non-existent claim
- Attempt to update non-existent claim
  - PATCH /claims/99999999 with valid status

## Claims API - Update > path parameter validation > PATCH with non-numeric ID should handle gracefully
- PATCH /claims/invalid-id
  - Try to update claim with non-numeric ID

## Claims API - Update > should reject invalid status transitions
- Create claim
  - Create claim starting in OPEN
- OPEN -> APPROVED is invalid
  - Skip intermediate state
- Update to IN_REVIEW (valid)
  - OPEN -> IN_REVIEW
- IN_REVIEW -> OPEN is invalid
  - Reverse transition
- Update to APPROVED (valid)
  - IN_REVIEW -> APPROVED
- APPROVED -> IN_REVIEW is invalid
  - Reverse transition

## Claims API - Update > should reject update when status is missing, empty or invalid
- Create claim
  - Create claim for negative update tests
- PATCH without status yields 400
  - Missing status field
- PATCH with empty status yields 400
  - Empty status string
- PATCH with invalid status yields 400
  - Unknown status value

## Claims API - Update > should update status along the allowed chain
- Prepare payload
  - Build CreateClaimDto with valid fields
- Create claim
  - POST /claims expect 201
- Update OPEN -> IN_REVIEW
  - PATCH /claims/{id} status=IN_REVIEW
- Update IN_REVIEW -> APPROVED
  - PATCH status=APPROVED
- Update APPROVED -> PAID
  - PATCH status=PAID
- Further update after PAID should be rejected
  - Attempt invalid change from PAID

## Claims API - Update > unknown fields in update payload should be ignored
- Create claim
  - Create claim to update
- PATCH with extra field and valid status
  - Include non-existent field
- PATCH with only unknown field should fail
  - Wrong field name (state)

