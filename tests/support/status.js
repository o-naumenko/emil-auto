// Simple enum-like object for claim statuses
const ClaimStatus = Object.freeze({
  OPEN: 'OPEN',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
});

module.exports = { ClaimStatus };
