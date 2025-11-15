# Test Steps

## Claims API - Create > created claim should appear in list and in OPEN-filtered list
- Create claim
  - POST /claims expect 201
- Verify in list()
  - Claim appears in GET /claims
- Verify in list('OPEN')
  - Claim appears in GET /claims?status=OPEN
- Verify absent in list('PAID')
  - Claim not in GET /claims?status=PAID

## Claims API - Create > createdAt should be ISO-8601 and recent
- Create claim
  - POST /claims expect 201
- Validate createdAt
  - Check createdAt is ISO string and recent

## Claims API - Create > creating multiple claims in parallel yields unique ids
- Create N claims in parallel
  - POST /claims x3
- Verify unique ids
  - IDs should be unique

## Claims API - Create > GET non-existent claim returns 404
- GET /claims/{id} with non-existent id
  - Expect 404 for very large id

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

## Claims API - Create > supports Unicode in text fields (roundtrip)
- Create with Unicode text
  - POST /claims with Unicode characters
- Verify roundtrip equality
  - Check Unicode preserved in response

## Claims API - Create > unknown fields in payload should be ignored by the API
- Create with unknown field
  - POST /claims with extra property
- Verify unknown field not returned
  - Response should not contain unknownField

## Claims API - Create > wrong content-type yields 400
- POST /claims with text/plain
  - Send text/plain payload, expect 400

