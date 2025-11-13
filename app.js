const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for claims
let claims = [
  {
    id: 1,
    policyNumber: 'PN-1001',
    claimantName: 'Alice Johnson',
    damageDate: '2025-10-01',
    lossDescription: 'Water leak in kitchen',
    status: 'OPEN',
    createdAt: '2025-11-01T10:00:00.000Z',
  },
  {
    id: 2,
    policyNumber: 'PN-1002',
    claimantName: 'Bob Smith',
    damageDate: '2025-09-15',
    lossDescription: 'Car accident at intersection',
    status: 'IN_REVIEW',
    createdAt: '2025-11-02T09:30:00.000Z',
  },
  {
    id: 3,
    policyNumber: 'PN-1003',
    claimantName: 'Carol Davis',
    damageDate: '2025-08-20',
    lossDescription: 'Roof damage from hail',
    status: 'APPROVED',
    createdAt: '2025-11-03T14:45:00.000Z',
  },
  {
    id: 4,
    policyNumber: 'PN-1004',
    claimantName: 'David Lee',
    damageDate: '2025-07-10',
    lossDescription: 'Theft of personal property',
    status: 'PAID',
    createdAt: '2025-11-04T16:20:00.000Z',
  },
];
let claimIdCounter = Math.max(0, ...claims.map(c => c.id)) + 1;
const STATUSES = ['OPEN', 'IN_REVIEW', 'APPROVED', 'PAID'];
const NEXT_STATUS = {
  OPEN: 'IN_REVIEW',
  IN_REVIEW: 'APPROVED',
  APPROVED: 'PAID',
  PAID: null,
};

// Middleware
app.use(bodyParser.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Claims Management API',
      version: '1.0.0',
      description: 'API for managing insurance claims',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./app.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Claim:
 *       type: object
 *       required:
 *         - policyNumber
 *         - claimantName
 *         - damageDate
 *         - lossDescription
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the claim
 *         policyNumber:
 *           type: string
 *           description: Policy number associated with the claim
 *         claimantName:
 *           type: string
 *           description: Name of the claimant
 *         damageDate:
 *           type: string
 *           format: date
 *           description: Date of damage (YYYY-MM-DD)
 *         lossDescription:
 *           type: string
 *           description: Description of the loss
 *         status:
 *           type: string
 *           enum: [OPEN, IN_REVIEW, APPROVED, PAID]
 *           default: OPEN
 *           description: Status of the claim
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the claim was created
 */

/**
 * @swagger
 * /claims:
 *   get:
 *     summary: Returns the list of claims (optionally filtered by status)
 *     tags: [Claims]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_REVIEW, APPROVED, PAID]
 *         required: false
 *         description: Filter claims by status
 *     responses:
 *       200:
 *         description: The list of claims
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Claim'
 */
app.get('/claims', (req, res) => {
  const { status } = req.query;
  if (status) {
    if (!STATUSES.includes(status)) {
      return res.status(400).send('Invalid status filter');
    }
    return res.json(claims.filter(c => c.status === status));
  }
  res.json(claims);
});

/**
 * @swagger
 * /claims/{id}:
 *   get:
 *     summary: Get a claim by ID
 *     tags: [Claims]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Claim ID
 *     responses:
 *       200:
 *         description: The claim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Claim'
 *       404:
 *         description: Claim not found
 */
app.get('/claims/:id', (req, res) => {
  const claim = claims.find(c => c.id === parseInt(req.params.id));
  if (!claim) return res.status(404).send('Claim not found');
  res.json(claim);
});

/**
 * @swagger
 * /claims:
 *   post:
 *     summary: Create a new claim
 *     tags: [Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Claim'
 *     responses:
 *       201:
 *         description: The created claim
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Claim'
 */
app.post('/claims', (req, res) => {
  const { policyNumber, claimantName, damageDate, lossDescription } = req.body;

  if (!policyNumber || !claimantName || !damageDate || !lossDescription) {
    return res.status(400).send('policyNumber, claimantName, damageDate, and lossDescription are required');
  }

  const newClaim = {
    id: claimIdCounter++,
    policyNumber,
    claimantName,
    damageDate,
    lossDescription,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
  };

  claims.push(newClaim);
  res.status(201).json(newClaim);
});

/**
 * @swagger
 * /claims/{id}:
 *   patch:
 *     summary: Update a claim status
 *     tags: [Claims]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Claim ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_REVIEW, APPROVED, PAID]
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: The updated claim with new status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Claim'
 *       404:
 *         description: Claim not found
 */
app.patch('/claims/:id', (req, res) => {
  const claim = claims.find(c => c.id === parseInt(req.params.id));
  if (!claim) return res.status(404).send('Claim not found');

  const { status } = req.body;
  if (!status || !STATUSES.includes(status)) {
    return res.status(400).send('Valid status is required');
  }

  const next = NEXT_STATUS[claim.status];
  if (next !== status) {
    if (next === null && claim.status === 'PAID') {
      return res.status(400).send('Claim is already in final status PAID');
    }
    return res.status(400).send(`Invalid status transition from ${claim.status} to ${status}`);
  }

  claim.status = status;
  res.json(claim);
});

// (Delete endpoint intentionally omitted in the current spec)

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;
