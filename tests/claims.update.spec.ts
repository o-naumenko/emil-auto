import { test, expect } from './fixtures';
import { CreateClaimDto } from './support/dtos';
import { ClaimStatus } from './support/status';
import { createStepLogger, expect201, expectJson } from './support/testUtils';
import { buildCreatePayload } from './support/builders';
import { createAndParse } from './support/api';

// Claims API - Update
// Covers: valid updates, invalid payloads (missing/empty/invalid status, unknown fields), and invalid transition attempts

test.describe('Claims API - Update', () => {
  test('should update status along the allowed chain', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should update status along the allowed chain');

    await test.step('Prepare payload', async () => {
      add('Build CreateClaimDto with valid fields');
    });

    const dto = new CreateClaimDto(buildCreatePayload());

    const createRes = await test.step('Create claim', async () => {
      add('POST /claims expect 201');
      const { res } = await createAndParse(claimsClient, dto);
      await expect201(res);
      await expectJson(res);
      return res;
    });
    const created = await createRes.json();

    await test.step('Update OPEN -> IN_REVIEW', async () => {
      add('PATCH /claims/{id} status=IN_REVIEW');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.IN_REVIEW);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe(ClaimStatus.IN_REVIEW);
    });

    await test.step('Update IN_REVIEW -> APPROVED', async () => {
      add('PATCH status=APPROVED');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.APPROVED);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe(ClaimStatus.APPROVED);
    });

    await test.step('Update APPROVED -> PAID', async () => {
      add('PATCH status=PAID');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.PAID);
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe(ClaimStatus.PAID);
    });

    await test.step('Further update after PAID should be rejected', async () => {
      add('Attempt invalid change from PAID');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.APPROVED);
      expect(res.status()).toBe(400);
    });

    await attach();
  });

  test('should reject update when status is missing, empty or invalid', async ({ request, baseURL, claimsClient }) => {
    const { add, attach } = createStepLogger('should reject update when status is missing, empty or invalid');

    const dto = new CreateClaimDto(buildCreatePayload());
    const createRes = await test.step('Create claim', async () => {
      add('Create claim for negative update tests');
      const { res } = await createAndParse(claimsClient, dto);
      await expect201(res);
      await expectJson(res);
      return res;
    });
    const created = await createRes.json();

    await test.step('PATCH without status yields 400', async () => {
      add('Missing status field');
      const res = await request.patch(`${baseURL}/claims/${created.id}`, { data: {} });
      expect(res.status()).toBe(400);
    });

    await test.step('PATCH with empty status yields 400', async () => {
      add('Empty status string');
      const res = await request.patch(`${baseURL}/claims/${created.id}`, { data: { status: '' } });
      expect(res.status()).toBe(400);
    });

    await test.step('PATCH with invalid status yields 400', async () => {
      add('Unknown status value');
      const res = await request.patch(`${baseURL}/claims/${created.id}`, { data: { status: 'INVALID' } });
      expect(res.status()).toBe(400);
    });

    await attach();
  });

  test('should reject invalid status transitions', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should reject invalid status transitions');

    const dto = new CreateClaimDto(buildCreatePayload());
    const createRes = await test.step('Create claim', async () => {
      add('Create claim starting in OPEN');
      const { res } = await createAndParse(claimsClient, dto);
      await expect201(res);
      await expectJson(res);
      return res;
    });
    const created = await createRes.json();

    await test.step('OPEN -> APPROVED is invalid', async () => {
      add('Skip intermediate state');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.APPROVED);
      expect(res.status()).toBe(400);
    });

    await test.step('Update to IN_REVIEW (valid)', async () => {
      add('OPEN -> IN_REVIEW');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.IN_REVIEW);
      expect(res.status()).toBe(200);
    });

    await test.step('IN_REVIEW -> OPEN is invalid', async () => {
      add('Reverse transition');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.OPEN);
      expect(res.status()).toBe(400);
    });

    await test.step('Update to APPROVED (valid)', async () => {
      add('IN_REVIEW -> APPROVED');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.APPROVED);
      expect(res.status()).toBe(200);
    });

    await test.step('APPROVED -> IN_REVIEW is invalid', async () => {
      add('Reverse transition');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.IN_REVIEW);
      expect(res.status()).toBe(400);
    });

    await attach();
  });

  test('unknown fields in update payload should be ignored', async ({ request, baseURL, claimsClient }) => {
    const { add, attach } = createStepLogger('unknown fields in update payload should be ignored');

    const dto = new CreateClaimDto(buildCreatePayload());
    const createRes = await test.step('Create claim', async () => {
      add('Create claim to update');
      const { res } = await createAndParse(claimsClient, dto);
      await expect201(res);
      await expectJson(res);
      return res;
    });
    const created = await createRes.json();

    await test.step('PATCH with extra field and valid status', async () => {
      add('Include non-existent field');
      const res = await request.patch(`${baseURL}/claims/${created.id}`, { data: { status: ClaimStatus.IN_REVIEW, foo: 'bar' } });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe(ClaimStatus.IN_REVIEW);
      expect(body).not.toHaveProperty('foo');
    });

    await test.step('PATCH with only unknown field should fail', async () => {
      add('Wrong field name (state)');
      const res = await request.patch(`${baseURL}/claims/${created.id}`, { data: { state: ClaimStatus.APPROVED } as any });
      expect(res.status()).toBe(400);
    });

    await attach();
  });
});
