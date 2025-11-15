import { test, expect } from './fixtures';
import { CreateClaimDto } from './support/dtos';
import { createStepLogger, expect201, expectJson } from './support/testUtils';
import { buildCreatePayload } from './support/builders';
import { createAndParse } from './support/api';
import { ClaimStatus } from './support/status';

// Claims API - List
// Covers: default unfiltered list, filtering by valid status, invalid status filter

test.describe('Claims API - List', () => {
  test('should return list of claims unfiltered by default', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should return list of claims unfiltered by default');

    await test.step('Prepare payload', async () => {
      add('Build CreateClaimDto with valid fields');
    });

    const dto = new CreateClaimDto(buildCreatePayload());

    const createRes = await test.step('Create a claim to ensure it appears in the list', async () => {
      add('POST /claims expect 201');
      const { res } = await createAndParse(claimsClient, dto);
      await expect201(res);
      await expectJson(res);
      return res;
    });

    const created = await createRes.json();

    await test.step('GET /claims returns an array that includes created id', async () => {
      add('Verify created id is present in list()');
      const all = await claimsClient.list();
      expect(Array.isArray(all)).toBe(true);
      expect(all.some((c: any) => c.id === created.id)).toBe(true);
    });

    await attach();
  });

  test('should filter list by valid status', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should filter list by valid status');

    await test.step('Create claims in OPEN and PAID for filter checks', async () => {
      add('Create two claims');
      const dto1 = new CreateClaimDto(buildCreatePayload());
      const dto2 = new CreateClaimDto(buildCreatePayload());
      const r1 = await createAndParse(claimsClient, dto1);
      await expect201(r1.res); await expectJson(r1.res);
      const r2 = await createAndParse(claimsClient, dto2);
      await expect201(r2.res); await expectJson(r2.res);
      // Leave status OPEN by default; PAID exists from seed data
    });

    await test.step("Verify list('OPEN') contains only OPEN claims", async () => {
      add('GET /claims?status=OPEN');
      const open = await claimsClient.list(ClaimStatus.OPEN);
      expect(Array.isArray(open)).toBe(true);
      expect(open.every((c: any) => c.status === ClaimStatus.OPEN)).toBe(true);
    });

    await test.step("Verify list('PAID') contains only PAID claims", async () => {
      add('GET /claims?status=PAID');
      const paid = await claimsClient.list(ClaimStatus.PAID);
      expect(Array.isArray(paid)).toBe(true);
      expect(paid.every((c: any) => c.status === ClaimStatus.PAID)).toBe(true);
    });

    await attach();
  });

  test('invalid status filter returns 400', async ({ request, baseURL }) => {
    const { add, attach } = createStepLogger('invalid status filter returns 400');

    await test.step('GET /claims?status=INVALID yields 400', async () => {
      add('Use invalid status filter');
      const res = await request.get(`${baseURL}/claims?status=INVALID`);
      expect(res.status()).toBe(400);
    });

    await attach();
  });
});
