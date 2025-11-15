# Claims Management API

A simple Node.js API for managing insurance claims with OpenAPI (Swagger) documentation.

## Features

- Create, get, list/filter, and update claim status
- Interactive API documentation with Swagger UI
- In-memory data storage (no database setup required)

## Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install express swagger-ui-express swagger-jsdoc body-parser
   ```

## Running the Application

1. Start the server:
   ```bash
   node app.js
   ```
2. Access the API documentation at: http://localhost:3000/api-docs
3. OpenAPI file: [openapi.yaml](./openapi.yaml)

## Running Tests

- Start the API server (in another terminal):
  ```bash
  node app.js
  ```
- Run the end-to-end API tests:
  ```bash
  npm run test:e2e
  ```
- View the Playwright HTML report locally:
  ```bash
  npx playwright show-report
  ```
- Generate test cases documentation (from test.step blocks):
  ```bash
  npm run docs:steps
  # output: ./test-cases.md
  ```

## API Endpoints

- `POST /claims` – Create a claim
- `GET /claims/{id}` – Get a claim
- `PATCH /claims/{id}` – Update status (OPEN → IN_REVIEW → APPROVED → PAID)
- `GET /claims` – List/filter claims (query `status`)

## Example Requests

### Create a new claim
```http
POST /claims
Content-Type: application/json

{
  "policyNumber": "POL-123456",
  "claimantName": "Jane Doe",
  "damageDate": "2025-11-01",
  "lossDescription": "Rear-ended at traffic light"
}
```

### Update a claim status
```http
PATCH /claims/1
Content-Type: application/json

{
  "status": "IN_REVIEW"
}
```

### Get a claim
```http
GET /claims/1
```

### List/filter claims
```http
GET /claims?status=OPEN
```

## CI & Reports

- Pull requests run a single check that executes the Playwright API tests and publishes the HTML report to GitHub Pages as a preview.
- The workflow file is at `.github/workflows/playwright-pages.yml`.
- Manual runs are available via `.github/workflows/manual-tests.yml` and also publish a preview.

## License

MIT
