export type CreateClaimDtoParams = {
  policyNumber: string;
  claimantName: string;
  damageDate: string; // YYYY-MM-DD
  lossDescription: string;
};

export class CreateClaimDto {
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

export function makeCreateClaimDto(params: CreateClaimDtoParams): CreateClaimDto {
  return new CreateClaimDto(params);
}
