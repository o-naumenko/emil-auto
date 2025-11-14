import { ClaimStatus } from '../support/status';

export interface Claim {
  id: number;
  policyNumber: string;
  claimantName: string;
  damageDate: string; // YYYY-MM-DD
  lossDescription: string;
  status: ClaimStatus;
}
