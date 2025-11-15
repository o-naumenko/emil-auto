import { test, expect } from './fixtures';
import { CreateClaimDto } from './support/dtos';
import { createStepLogger, expect201, expectJson } from './support/testUtils';
import { buildCreatePayload } from './support/builders';
import { createAndParse } from './support/api';

test.describe('Claims API - Get', () => {
  test('should get an existing claim by id', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should get an existing claim by id');

    await test.step('Prepare payload', async () => {
      add('Build CreateClaimDto with valid fields');
    });

    const dto = new CreateClaimDto(buildCreatePayload());

    const createRes = await test.step('Create a claim to read later', async () => {
      add('POST /claims expect 201');
      const { res } = await createAndParse(claimsClient, dto);
      await expect201(res);
      await expectJson(res);
      return res;
    });

    const created = await createRes.json();

    await test.step('GET /claims/{id} returns 200 with the same claim', async () => {
      add('Fetch by id and compare fields');
      const res = await claimsClient.get(created.id);
      expect(res.status()).toBe(200);
      await expectJson(res);
      const body = await res.json();
      expect(body).toMatchObject({
        id: created.id,
        policyNumber: dto.policyNumber,
        claimantName: dto.claimantName,
        damageDate: dto.damageDate,
        lossDescription: dto.lossDescription,
      });
    });

    await attach();
  });

  test('GET non-existent claim returns 404', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('GET non-existent claim returns 404');
    await test.step('GET /claims/{id} with non-existent id', async () => {
      add('Expect 404 for very large id');
      const res = await claimsClient.get(99999999);
      expect(res.status()).toBe(404);
    });
    await attach();
  });

  test('GET should return application/json content-type', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('GET should return application/json content-type');

    await test.step('Prepare payload', async () => {
      add('Build CreateClaimDto with valid fields');
    });

    const dto = new CreateClaimDto(buildCreatePayload());
    const created = await test.step('Create a claim for GET validation', async () => {
      add('Create a claim to validate GET headers');
      const { res } = await createAndParse(claimsClient, dto);
      await expect201(res);
      await expectJson(res);
      return res.json();
    });

    await test.step('GET /claims/{id} has application/json content-type', async () => {
      add('Verify content-type header contains application/json');
      const res = await claimsClient.get((await created).id);
      expect(res.status()).toBe(200);
      await expectJson(res);
    });

    await attach();
  });
});
