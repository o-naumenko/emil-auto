import { test, expect } from './fixtures';
import { CreateClaimDto } from './support/dtos';
import { createStepLogger, expect201, expectJson, expect400 } from './support/testUtils';
import { createAndParse } from './support/api';
import { ClaimStatus } from './support/status';

test.describe('Claims API - List', () => {
  test('should return list of claims unfiltered by default', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should return list of claims unfiltered by default');

    await test.step('Prepare payload', async () => {
      add('Build CreateClaimDto with valid fields');
    });

    const dto = new CreateClaimDto(CreateClaimDto.defaults());

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
      const all = await claimsClient.listAndParse();
      expect(Array.isArray(all)).toBe(true);
      expect(all.some((c) => c.id === created.id)).toBe(true);
    });

    await attach();
  });

  test('should filter list by valid status', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should filter list by valid status');

    const openClaim = await test.step('Create claims in OPEN status', async () => {
      add('Create test claims');
      const dto1 = new CreateClaimDto(CreateClaimDto.defaults());
      const dto2 = new CreateClaimDto(CreateClaimDto.defaults());
      const r1 = await createAndParse(claimsClient, dto1);
      await expect201(r1.res); await expectJson(r1.res);
      const r2 = await createAndParse(claimsClient, dto2);
      await expect201(r2.res); await expectJson(r2.res);
      return r1.body;
    });

    await test.step("Verify list('OPEN') contains only OPEN claims", async () => {
      add('GET /claims?status=OPEN');
      const open = await claimsClient.listAndParse(ClaimStatus.OPEN);
      expect(Array.isArray(open)).toBe(true);
      expect(open.length).toBeGreaterThan(0);
      expect(open.every((c) => c.status === ClaimStatus.OPEN)).toBe(true);
      expect(open.some((c) => c.id === openClaim.id)).toBe(true);
    });

    await test.step("Verify list('PAID') contains only PAID claims if any exist", async () => {
      add('GET /claims?status=PAID');
      const paid = await claimsClient.listAndParse(ClaimStatus.PAID);
      expect(Array.isArray(paid)).toBe(true);
      if (paid.length > 0) {
        expect(paid.every((c) => c.status === ClaimStatus.PAID)).toBe(true);
      }
    });

    await attach();
  });

  test('invalid status filter returns 400', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('invalid status filter returns 400');

    await test.step('GET /claims?status=INVALID yields 400', async () => {
      add('Use invalid status filter');
      const res = await claimsClient.list('INVALID');
      await expect400(res);
    });

    await attach();
  });

  test.describe('response schema validation', () => {
    test('LIST response is array of valid claims', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('LIST response is array of valid claims');
      
      await test.step('Create test claim', async () => {
        add('Ensure at least one claim exists');
        const dto = new CreateClaimDto(CreateClaimDto.defaults());
        await createAndParse(claimsClient, dto);
      });

      await test.step('GET /claims and validate array schema', async () => {
        add('GET list and validate each item');
        const claims = await claimsClient.listAndParse();
        
        expect(Array.isArray(claims)).toBe(true);
        expect(claims.length).toBeGreaterThan(0);
        
        // Validate first claim has correct structure
        const firstClaim = claims[0];
        expect(firstClaim).toMatchObject({
          id: expect.any(Number),
          policyNumber: expect.any(String),
          claimantName: expect.any(String),
          damageDate: expect.any(String),
          lossDescription: expect.any(String),
          status: expect.stringMatching(/^(OPEN|IN_REVIEW|APPROVED|PAID)$/),
          createdAt: expect.any(String),
        });
      });

      await attach();
    });
  });
});
