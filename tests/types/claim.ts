import { ClaimStatus } from '../support/status';

/**
 * Claim entity as returned by the API
 * Matches the OpenAPI schema definition
 */
export interface Claim {
  id: number;
  policyNumber: string;
  claimantName: string;
  damageDate: string; // YYYY-MM-DD
  lossDescription: string;
  status: ClaimStatus;
  createdAt: string; // ISO 8601 timestamp
}
