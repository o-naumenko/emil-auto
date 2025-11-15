# Test Steps

## Claims API - Create > creating multiple claims in parallel yields unique ids
- Create N claims in parallel
  - POST /claims x3
- Verify unique ids
  - IDs should be unique

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

## Claims API - List > should filter list by valid status
- Create claims in OPEN and PAID for filter checks
  - Create two claims
- Verify list('OPEN') contains only OPEN claims
  - GET /claims?status=OPEN
- Verify list('PAID') contains only PAID claims
  - GET /claims?status=PAID

## Claims API - List > should return list of claims unfiltered by default
- Prepare payload
  - Build CreateClaimDto with valid fields
- Create a claim to ensure it appears in the list
  - POST /claims expect 201
- GET /claims returns an array that includes created id
  - Verify created id is present in list()

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

