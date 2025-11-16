import { TEST_CONFIG } from '../config/test.config';

export type CreateClaimDtoParams = {
  policyNumber: string;
  claimantName: string;
  damageDate: string; // YYYY-MM-DD
  lossDescription: string;
};

/**
 * DTO for creating claims with factory methods for test data generation
 */
export class CreateClaimDto {
  static readonly REQUIRED_FIELDS = [
    'policyNumber',
    'claimantName',
    'damageDate',
    'lossDescription',
  ] as const;

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

  /**
   * Factory method to create test data with optional overrides
   * Uses crypto.randomUUID for better uniqueness in parallel execution
   */
  static defaults(overrides: Partial<CreateClaimDtoParams> = {}): CreateClaimDtoParams {
    // Generate unique policy number using UUID substring for better uniqueness
    const uniqueId = crypto.randomUUID().substring(0, 8).toUpperCase();
    
    return {
      policyNumber: `PN-${uniqueId}`,
      claimantName: TEST_CONFIG.testData.defaultClaimant,
      damageDate: TEST_CONFIG.testData.defaultDate,
      lossDescription: TEST_CONFIG.testData.defaultDescription,
      ...overrides,
    };
  }

  /**
   * Serialize to plain object for API requests
   */
  toJSON(): CreateClaimDtoParams {
    return {
      policyNumber: this.policyNumber,
      claimantName: this.claimantName,
      damageDate: this.damageDate,
      lossDescription: this.lossDescription,
    };
  }
}
