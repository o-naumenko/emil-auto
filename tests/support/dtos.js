// DTO helpers for claim data

/**
 * Create DTO for POST /claims
 * @param {Object} params
 * @param {string} params.policyNumber
 * @param {string} params.claimantName
 * @param {string} params.damageDate // YYYY-MM-DD
 * @param {string} params.lossDescription
 */
function makeCreateClaimDto({ policyNumber, claimantName, damageDate, lossDescription }) {
  return { policyNumber, claimantName, damageDate, lossDescription };
}

module.exports = { makeCreateClaimDto };
