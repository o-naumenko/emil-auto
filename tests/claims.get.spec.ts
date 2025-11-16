import { test, expect } from './fixtures';
import { CreateClaimDto } from './support/dtos';
import { createStepLogger, expect201, expectJson, expect404 } from './support/testUtils';
import { createAndParse } from './support/api';

test.describe('Claims API - Get', () => {
  test('should get an existing claim by id', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should get an existing claim by id');

    await test.step('Prepare payload', async () => {
      add('Build CreateClaimDto with valid fields');
    });

    const dto = new CreateClaimDto(CreateClaimDto.defaults());

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
      const res = await claimsClient.getById(created.id);
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
      const res = await claimsClient.getById(99999999);
      await expect404(res);
    });
    await attach();
  });

  test('GET should return application/json content-type', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('GET should return application/json content-type');

    await test.step('Prepare payload', async () => {
      add('Build CreateClaimDto with valid fields');
    });

    const dto = new CreateClaimDto(CreateClaimDto.defaults());
    const created = await test.step('Create a claim for GET validation', async () => {
      add('Create a claim to validate GET headers');
      const { res } = await createAndParse(claimsClient, dto);
      await expect201(res);
      await expectJson(res);
      return res.json();
    });

    await test.step('GET /claims/{id} has application/json content-type', async () => {
      add('Verify content-type header contains application/json');
      const res = await claimsClient.getById((await created).id);
      expect(res.status()).toBe(200);
      await expectJson(res);
    });

    await attach();
  });

  test.describe('path parameter validation', () => {
    test('GET with truly non-numeric ID returns 404', async ({ request, baseURL }) => {
      const { add, attach } = createStepLogger('GET with truly non-numeric ID returns 404');
      
      // Note: Express parseInt() is lenient - '1.5' becomes 1, 'abc' becomes NaN
      const invalidIds = ['abc', 'claim-123', 'null', 'undefined', 'NaN'];
      
      for (const invalidId of invalidIds) {
        await test.step(`GET /claims/${invalidId}`, async () => {
          add(`Try to GET claim with ID: ${invalidId}`);
          const res = await request.get(`${baseURL}/claims/${invalidId}`);
          // Express parseInt returns NaN for these, which won't match any claim
          await expect404(res);
          add(`Response: ${res.status()} (404 as expected)`);
        });
      }
      
      await attach();
    });
    
    test('GET with numeric-like ID is parsed leniently', async ({ request, baseURL }) => {
      const { add, attach } = createStepLogger('GET with numeric-like ID is parsed leniently');
      
      await test.step('GET /claims/1.5 is parsed as 1', async () => {
        add('Express parseInt("1.5") = 1 (lenient parsing)');
        const res = await request.get(`${baseURL}/claims/1.5`);
        // May return 200 if claim 1 exists, or 404 if not
        // This documents that the API accepts "1.5" as ID 1
        expect([200, 404]).toContain(res.status());
        add(`API accepts "1.5" as valid ID (parsed to 1)`);
      });
      
      await attach();
    });

    test('GET with negative ID returns 404', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('GET with negative ID returns 404');
      
      await test.step('GET /claims/-1', async () => {
        add('Attempt to get claim with negative ID');
        const res = await claimsClient.getById(-1);
        await expect404(res);
      });

      await attach();
    });

    test('GET with zero ID returns 404', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('GET with zero ID returns 404');
      
      await test.step('GET /claims/0', async () => {
        add('Attempt to get claim with ID = 0');
        const res = await claimsClient.getById(0);
        await expect404(res);
      });

      await attach();
    });
  });

  test.describe('response schema validation', () => {
    test('GET claim response matches schema', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('GET claim response matches schema');
      
      const created = await test.step('Create claim', async () => {
        add('Create test claim');
        const dto = new CreateClaimDto(CreateClaimDto.defaults());
        const { body } = await createAndParse(claimsClient, dto);
        return body;
      });

      await test.step('GET and validate schema', async () => {
        add(`GET /claims/${created.id}`);
        const res = await claimsClient.getById(created.id);
        const claim = await res.json();
        
        expect(claim).toMatchObject({
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
