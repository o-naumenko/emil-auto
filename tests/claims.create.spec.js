const { test, expect } = require('@playwright/test');
const { ClaimsClient } = require('./clients/claimsClient');
const { makeCreateClaimDto } = require('./support/dtos');
const { ClaimStatus } = require('./support/status');

// Basic API test: create a new claim and fetch it

test.describe('Claims API - Create', () => {
  test('should create a new claim and retrieve it by id', async ({ request, baseURL }) => {
    const client = new ClaimsClient(request, baseURL);

    const dto = makeCreateClaimDto({
      policyNumber: `PN-${Date.now()}`,
      claimantName: 'Test User',
      damageDate: '2025-11-01',
      lossDescription: 'Integration test loss',
    });

    const createRes = await client.create(dto);
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    expect(created).toMatchObject({
      policyNumber: dto.policyNumber,
      claimantName: dto.claimantName,
      damageDate: dto.damageDate,
      lossDescription: dto.lossDescription,
      status: ClaimStatus.OPEN,
    });
    expect(created).toHaveProperty('id');
    expect(typeof created.id).toBe('number');

    const getRes = await client.get(created.id);
    expect(getRes.status()).toBe(200);
    const fetched = await getRes.json();
    expect(fetched).toMatchObject(created);
  });
});
