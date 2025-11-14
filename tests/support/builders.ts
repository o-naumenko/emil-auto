import { CreateClaimDto } from './dtos';

export function buildCreatePayload(overrides: Partial<CreateClaimDto> = {}) {
  return CreateClaimDto.defaults({
    policyNumber: overrides['policyNumber' as keyof CreateClaimDto] as any ?? `PN-${Date.now()}`,
    claimantName: overrides['claimantName' as keyof CreateClaimDto] as any ?? 'Test User',
    damageDate: overrides['damageDate' as keyof CreateClaimDto] as any ?? '2025-11-01',
    lossDescription: overrides['lossDescription' as keyof CreateClaimDto] as any ?? 'Integration test loss',
  }) as any;
}
