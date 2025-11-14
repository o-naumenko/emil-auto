export type CreateClaimDtoParams = {
  policyNumber: string;
  claimantName: string;
  damageDate: string; // YYYY-MM-DD
  lossDescription: string;
};

export class CreateClaimDto {
  static REQUIRED_FIELDS = [
    'policyNumber',
    'claimantName',
    'damageDate',
    'lossDescription',
  ] as const;

  // Returns a default payload; callers can override any field via partial
  static defaults(overrides: Partial<CreateClaimDtoParams> = {}): CreateClaimDtoParams {
    return {
      policyNumber: `PN-${Date.now()}`,
      claimantName: 'Test User',
      damageDate: '2025-11-01',
      lossDescription: 'Integration test loss',
      ...overrides,
    };
  }

  policyNumber: string;
  claimantName: string;
  damageDate: string;
  lossDescription: string;

  constructor({ policyNumber, claimantName, damageDate, lossDescription }: CreateClaimDtoParams) {
    this.policyNumber = policyNumber;
    this.claimantName = claimantName;
    this.damageDate = damageDate;
    this.lossDescription = lossDescription;
  }

  toJSON() {
    return {
      policyNumber: this.policyNumber,
      claimantName: this.claimantName,
      damageDate: this.damageDate,
      lossDescription: this.lossDescription,
    };
  }
}
