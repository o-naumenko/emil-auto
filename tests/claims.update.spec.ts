import { test, expect } from './fixtures';
import { CreateClaimDto } from './support/dtos';
import { ClaimStatus } from './support/status';
import { createStepLogger, expect201, expectJson, expect200, expect400, expect404 } from './support/testUtils';
import { createAndParse } from './support/api';

test.describe('Claims API - Update', () => {
  test('should update status along the allowed chain', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should update status along the allowed chain');

    await test.step('Prepare payload', async () => {
      add('Build CreateClaimDto with valid fields');
    });

    const dto = new CreateClaimDto(CreateClaimDto.defaults());

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
      await expect200(res);
      const body = await res.json();
      expect(body.status).toBe(ClaimStatus.IN_REVIEW);
    });

    await test.step('Update IN_REVIEW -> APPROVED', async () => {
      add('PATCH status=APPROVED');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.APPROVED);
      await expect200(res);
      const body = await res.json();
      expect(body.status).toBe(ClaimStatus.APPROVED);
    });

    await test.step('Update APPROVED -> PAID', async () => {
      add('PATCH status=PAID');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.PAID);
      await expect200(res);
      const body = await res.json();
      expect(body.status).toBe(ClaimStatus.PAID);
    });

    await test.step('Further update after PAID should be rejected', async () => {
      add('Attempt invalid change from PAID');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.APPROVED);
      await expect400(res);
    });

    await attach();
  });

  test('should reject update when status is missing, empty or invalid', async ({ request, baseURL, claimsClient }) => {
    const { add, attach } = createStepLogger('should reject update when status is missing, empty or invalid');

    const dto = new CreateClaimDto(CreateClaimDto.defaults());
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
      await expect400(res);
    });

    await test.step('PATCH with empty status yields 400', async () => {
      add('Empty status string');
      const res = await request.patch(`${baseURL}/claims/${created.id}`, { data: { status: '' } });
      await expect400(res);
    });

    await test.step('PATCH with invalid status yields 400', async () => {
      add('Unknown status value');
      const res = await request.patch(`${baseURL}/claims/${created.id}`, { data: { status: 'INVALID' } });
      await expect400(res);
    });

    await attach();
  });

  test('should reject invalid status transitions', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should reject invalid status transitions');

    const dto = new CreateClaimDto(CreateClaimDto.defaults());
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
      await expect400(res);
    });

    await test.step('Update to IN_REVIEW (valid)', async () => {
      add('OPEN -> IN_REVIEW');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.IN_REVIEW);
      await expect200(res);
    });

    await test.step('IN_REVIEW -> OPEN is invalid', async () => {
      add('Reverse transition');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.OPEN);
      await expect400(res);
    });

    await test.step('Update to APPROVED (valid)', async () => {
      add('IN_REVIEW -> APPROVED');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.APPROVED);
      await expect200(res);
    });

    await test.step('APPROVED -> IN_REVIEW is invalid', async () => {
      add('Reverse transition');
      const res = await claimsClient.updateStatus(created.id, ClaimStatus.IN_REVIEW);
      await expect400(res);
    });

    await attach();
  });

  test('unknown fields in update payload should be ignored', async ({ request, baseURL, claimsClient }) => {
    const { add, attach } = createStepLogger('unknown fields in update payload should be ignored');

    const dto = new CreateClaimDto(CreateClaimDto.defaults());
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
      await expect200(res);
      const body = await res.json();
      expect(body.status).toBe(ClaimStatus.IN_REVIEW);
      expect(body).not.toHaveProperty('foo');
    });

    await test.step('PATCH with only unknown field should fail', async () => {
      add('Wrong field name (state)');
      const res = await request.patch(`${baseURL}/claims/${created.id}`, { data: { state: ClaimStatus.APPROVED } });
      await expect400(res);
    });

    await attach();
  });

  test.describe('PATCH 404 handling', () => {
    test('should return 404 when updating non-existent claim', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('should return 404 when updating non-existent claim');
      
      await test.step('Attempt to update non-existent claim', async () => {
        add('PATCH /claims/99999999 with valid status');
        const res = await claimsClient.updateStatus(99999999, ClaimStatus.IN_REVIEW);
        await expect404(res);
      });
      
      await attach();
    });

    test('should return 404 before validating status field', async ({ request, baseURL }) => {
      const { add, attach } = createStepLogger('should return 404 before validating status field');
      
      await test.step('Update non-existent claim with invalid status', async () => {
        add('PATCH /claims/99999999 with invalid status - expect 404 not 400');
        const res = await request.patch(`${baseURL}/claims/99999999`, { 
          data: { status: 'INVALID' } 
        });
        // Should return 404 (resource not found) before validating status
        await expect404(res);
      });
      
      await attach();
    });
  });

  test.describe('path parameter validation', () => {
    test('PATCH with non-numeric ID should handle gracefully', async ({ request, baseURL }) => {
      const { add, attach } = createStepLogger('PATCH with non-numeric ID should handle gracefully');
      
      await test.step('PATCH /claims/invalid-id', async () => {
        add('Try to update claim with non-numeric ID');
        const res = await request.patch(`${baseURL}/claims/invalid-id`, {
          data: { status: ClaimStatus.IN_REVIEW }
        });
        expect([400, 404]).toContain(res.status());
      });

      await attach();
    });
  });

  test.describe('idempotency', () => {
    test('updating to current status should be rejected or accepted', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('updating to current status should be rejected or accepted');
      
      const { body: claim } = await test.step('Create claim in OPEN status', async () => {
        add('Create claim');
        const dto = new CreateClaimDto(CreateClaimDto.defaults());
        return createAndParse(claimsClient, dto);
      });

      await test.step('Update OPEN -> OPEN (same status)', async () => {
        add('Attempt to update to current status');
        const res = await claimsClient.updateStatus(claim.id, ClaimStatus.OPEN);
        
        // API may choose to:
        // 1. Accept as idempotent (200)
        // 2. Reject as invalid transition (400)
        expect([200, 400]).toContain(res.status());
        
        if (res.status() === 200) {
          add('API accepts idempotent updates (200)');
        } else {
          add('API rejects same-status updates (400)');
        }
      });

      await attach();
    });
  });
});
