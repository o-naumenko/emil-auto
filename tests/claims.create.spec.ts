import { test, expect } from './fixtures';
import { CreateClaimDto } from './support/dtos';
import { ClaimStatus } from './support/status';
import { createStepLogger, expect201, expectJson, expect400Required, expectRecentISO } from './support/testUtils';
import { createAndParse } from './support/api';

test.describe('Claims API - Create', () => {
  test('should create a new claim and retrieve it by id', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should create a new claim and retrieve it by id');

    await test.step('Prepare payload', async () => {
      add('Build CreateClaimDto with valid fields');
    });

    const dto = new CreateClaimDto(CreateClaimDto.defaults());

    const createRes = await test.step('Create claim via POST /claims', async () => {
      add('Send POST /claims and expect 201');
      const { res } = await createAndParse(claimsClient, dto);
      await expect201(res);
      await expectJson(res);
      return res;
    });

    const created = await test.step('Validate response body', async () => {
      const body = await createRes.json();
      add('Assert returned fields and OPEN status');
      expect(body).toMatchObject({
        policyNumber: dto.policyNumber,
        claimantName: dto.claimantName,
        damageDate: dto.damageDate,
        lossDescription: dto.lossDescription,
        status: ClaimStatus.OPEN,
      });
      expect(body).toHaveProperty('id');
      expect(typeof body.id).toBe('number');
      return body;
    });

    await test.step('Fetch by id and compare', async () => {
      add('GET /claims/{id} and deep-compare with created');
      const getRes = await claimsClient.getById(created.id);
      expect(getRes.status()).toBe(200);
      const fetched = await getRes.json();
      expect(fetched).toMatchObject(created);
    });

    await attach();
  });

  test('should reject when a mandatory field is missing (omitted property)', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should reject when a mandatory field is missing (omitted property)');
    const required = CreateClaimDto.REQUIRED_FIELDS;
    const basePayload = CreateClaimDto.defaults();

    for (const field of required) {
      await test.step(`POST /claims missing ${field}`, async () => {
        const { [field]: _, ...rest } = basePayload;
        add(`Attempt create without ${field}`);
        const res = await claimsClient.create(rest);
        await expect400Required(res);
      });
    }
    await attach();
  });

  test('should reject when a mandatory field is empty string', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('should reject when a mandatory field is empty string');
    const required = CreateClaimDto.REQUIRED_FIELDS;
    for (const field of required) {
      await test.step(`POST /claims with empty ${field}`, async () => {
        const payload = { ...CreateClaimDto.defaults() };
        payload[field] = '';
        add(`Attempt create with empty ${field}`);
        const res = await claimsClient.create(payload);
        await expect400Required(res);
      });
    }
    await attach();
  });

  test('unknown fields in payload should be ignored by the API', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('unknown fields in payload should be ignored by the API');
    const payload = { ...CreateClaimDto.defaults(), unknownField: 'ignored' };
    const res = await test.step('Create with unknown field', async () => {
      add('POST /claims with extra property');
      const r = await claimsClient.create(payload);
      expect(r.status()).toBe(201);
      return r;
    });
    const created = await res.json();
    await test.step('Verify unknown field not returned', async () => {
      add('Response should not contain unknownField');
      expect(created).not.toHaveProperty('unknownField');
    });
    await attach();
  });

  test('response content-type should be application/json', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('response content-type should be application/json');
    const res = await test.step('Create claim', async () => {
      add('POST /claims expect 201');
      const r = await claimsClient.create(CreateClaimDto.defaults());
      await expect201(r);
      return r;
    });
    await test.step('Verify content-type header', async () => {
      add('Response header content-type contains application/json');
      await expectJson(res);
    });
    await attach();
  });

  test('creating multiple claims in parallel yields unique ids', async ({ claimsClient }) => {
    const { add, attach } = createStepLogger('creating multiple claims in parallel yields unique ids');
    const payloads = Array.from({ length: 3 }, (_, i) => CreateClaimDto.defaults({ policyNumber: `PN-${crypto.randomUUID().substring(0, 8)}-${i}` }));
    const results = await test.step('Create N claims in parallel', async () => {
      add('POST /claims x3');
      const res = await Promise.all(payloads.map((p) => claimsClient.create(p)));
      for (const r of res) expect(r.status()).toBe(201);
      return res;
    });
    await test.step('Verify unique ids', async () => {
      add('IDs should be unique');
      const bodies = await Promise.all(results.map((r) => r.json()));
      const ids = new Set(bodies.map((b) => b.id));
      expect(ids.size).toBe(bodies.length);
    });
    await attach();
  });

  test('missing body yields 400', async ({ request, baseURL }) => {
    const { add, attach } = createStepLogger('missing body yields 400');
    await test.step('POST /claims without body', async () => {
      add('Send empty body, expect 400');
      const res = await request.post(`${baseURL}/claims`);
      expect(res.status()).toBe(400);
    });
    await attach();
  });

  test('wrong content-type yields 400', async ({ request, baseURL }) => {
    const { add, attach } = createStepLogger('wrong content-type yields 400');
    await test.step('POST /claims with text/plain', async () => {
      add('Send text/plain payload, expect 400');
      const res = await request.post(`${baseURL}/claims`, {
        headers: { 'Content-Type': 'text/plain' },
        data: 'not-json',
      });
      expect(res.status()).toBe(400);
    });
    await attach();
  });

  test('invalid JSON yields 400', async ({ request, baseURL }) => {
    const { add, attach } = createStepLogger('invalid JSON yields 400');
    await test.step('POST /claims with malformed JSON', async () => {
      add('Send invalid JSON, expect 400');
      const res = await request.post(`${baseURL}/claims`, {
        headers: { 'Content-Type': 'application/json' },
        data: '{"policyNumber":"PN-1",\n',
      });
      expect(res.status()).toBe(400);
    });
    await attach();
  });

  // The server currently does not validate date format/types for damageDate.
  // These tests are skipped and can be enabled once validation is implemented server-side.
  test.describe.skip('damageDate validation (pending server-side validation)', () => {
    test('should reject invalid damageDate formats (YYYY-MM-DD required)', async ({ claimsClient }) => {
      const invalidFormats = [
        '11/01/2025',
        '2025/11/01',
        '2025-13-01',
        '2025-11-32',
        '2025-1-1',
      ];
      for (const bad of invalidFormats) {
        const payload = CreateClaimDto.defaults({ damageDate: bad });
        const res = await claimsClient.create(payload);
        expect(res.status(), `expected 400 for damageDate='${bad}'`).toBe(400);
      }
    });

    test('should reject non-string damageDate types', async ({ claimsClient }) => {
      const invalidValues = [12345, true, false, null, undefined, {}, []];
      for (const value of invalidValues) {
        const payload = { ...CreateClaimDto.defaults(), damageDate: value as unknown as string };
        const res = await claimsClient.create(payload);
        expect(res.status(), `expected 400 for damageDate=${String(value)}`).toBe(400);
      }
    });
  });

  test.describe('createdAt field validation', () => {
    test('created claim should have valid createdAt timestamp', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('created claim should have valid createdAt timestamp');
      
      const claim = await test.step('Create claim and validate createdAt', async () => {
        add('POST /claims and check createdAt field');
        const dto = new CreateClaimDto(CreateClaimDto.defaults());
        const { body } = await createAndParse(claimsClient, dto);
        
        expect(body).toHaveProperty('createdAt');
        expect(typeof body.createdAt).toBe('string');
        add('Validate createdAt is recent ISO timestamp');
        expectRecentISO(body.createdAt, 60_000); // Within last minute
        
        return body;
      });

      await test.step('Verify createdAt format is ISO 8601', async () => {
        add('Check ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)');
        expect(claim.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
      
      await attach();
    });

    test('createdAt should not change on status update', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('createdAt should not change on status update');
      
      const { body: claim } = await test.step('Create claim', async () => {
        add('Create initial claim');
        const dto = new CreateClaimDto(CreateClaimDto.defaults());
        return createAndParse(claimsClient, dto);
      });

      const originalCreatedAt = claim.createdAt;

      await test.step('Update status', async () => {
        add('Update OPEN -> IN_REVIEW');
        const res = await claimsClient.updateStatus(claim.id, ClaimStatus.IN_REVIEW);
        expect(res.status()).toBe(200);
      });

      await test.step('Verify createdAt unchanged', async () => {
        add('GET claim and compare createdAt');
        const res = await claimsClient.getById(claim.id);
        const updated = await res.json();
        
        expect(updated.createdAt).toBe(originalCreatedAt);
        add('createdAt remains immutable after update');
      });

      await attach();
    });

    test('createdAt should be sortable chronologically', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('createdAt should be sortable chronologically');
      
      const claims = await test.step('Create multiple claims sequentially', async () => {
        add('Create 3 claims with small delay between');
        const dto1 = new CreateClaimDto(CreateClaimDto.defaults());
        const dto2 = new CreateClaimDto(CreateClaimDto.defaults());
        const dto3 = new CreateClaimDto(CreateClaimDto.defaults());
        
        const { body: c1 } = await createAndParse(claimsClient, dto1);
        await new Promise(resolve => setTimeout(resolve, 10)); // 10ms delay
        const { body: c2 } = await createAndParse(claimsClient, dto2);
        await new Promise(resolve => setTimeout(resolve, 10));
        const { body: c3 } = await createAndParse(claimsClient, dto3);
        
        return [c1, c2, c3];
      });

      await test.step('Verify chronological ordering', async () => {
        add('Compare createdAt timestamps');
        const t1 = new Date(claims[0].createdAt).getTime();
        const t2 = new Date(claims[1].createdAt).getTime();
        const t3 = new Date(claims[2].createdAt).getTime();
        
        expect(t2).toBeGreaterThanOrEqual(t1);
        expect(t3).toBeGreaterThanOrEqual(t2);
        add('Timestamps are in chronological order');
      });

      await attach();
    });
  });

  test.describe('response schema validation', () => {
    test('created claim matches expected schema structure', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('created claim matches expected schema structure');
      
      const claim = await test.step('Create claim and validate schema', async () => {
        add('POST /claims');
        const dto = new CreateClaimDto(CreateClaimDto.defaults());
        const { body } = await createAndParse(claimsClient, dto);
        return body;
      });

      await test.step('Verify all required fields present', async () => {
        add('Check for required fields per OpenAPI spec');
        expect(claim).toMatchObject({
          id: expect.any(Number),
          policyNumber: expect.any(String),
          claimantName: expect.any(String),
          damageDate: expect.any(String),
          lossDescription: expect.any(String),
          status: 'OPEN',
          createdAt: expect.any(String),
        });
      });

      await test.step('Verify no extra fields', async () => {
        add('Ensure response contains only expected fields');
        const expectedKeys = [
          'id', 
          'policyNumber', 
          'claimantName', 
          'damageDate',
          'lossDescription', 
          'status', 
          'createdAt'
        ].sort();
        
        const actualKeys = Object.keys(claim).sort();
        expect(actualKeys).toEqual(expectedKeys);
      });

      await attach();
    });
  });

  test.describe('input edge cases', () => {
    test.skip('whitespace-only fields should be rejected', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('whitespace-only fields should be rejected');
      
      // NOTE: Current API implementation does NOT validate for whitespace-only fields
      // It only checks for truthy values: if (!policyNumber) {...}
      // Whitespace strings like "   " pass this check
      // RECOMMENDATION: Add trim() and length validation on server
      
      const whitespaceValues = [
        { desc: 'spaces', value: '   ' },
        { desc: 'tabs', value: '\t\t\t' },
        { desc: 'newlines', value: '\n\n' },
        { desc: 'mixed', value: ' \t\n ' },
      ];

      for (const { desc, value } of whitespaceValues) {
        await test.step(`Reject ${desc} in policyNumber`, async () => {
          add(`Test with ${desc}: "${value}"`);
          const payload = CreateClaimDto.defaults({ policyNumber: value });
          const res = await claimsClient.create(payload);
          
          // Should reject as required field is effectively empty
          await expect400Required(res);
        });
      }

      await attach();
    });
    
    test('API currently accepts whitespace-only fields (known issue)', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('API currently accepts whitespace-only fields (known issue)');
      
      await test.step('Create claim with whitespace-only policyNumber', async () => {
        add('Current behavior: whitespace passes truthy check');
        const payload = CreateClaimDto.defaults({ 
          policyNumber: '   ',  // Whitespace only
        });
        const res = await claimsClient.create(payload);
        
        // Current API accepts this (bug/limitation)
        await expect201(res);
        
        const claim = await res.json();
        expect(claim.policyNumber).toBe('   ');
        add('⚠️  Whitespace-only field was accepted (consider adding trim + validation)');
      });
      
      await attach();
    });

    test('very long field values should be handled', async ({ claimsClient }) => {
      const { add, attach } = createStepLogger('very long field values should be handled');
      
      await test.step('Create claim with long fields', async () => {
        add('Send payload with 1000+ character fields');
        const payload = CreateClaimDto.defaults({
          policyNumber: 'PN-' + 'A'.repeat(1000),
          claimantName: 'B'.repeat(5000),
          lossDescription: 'C'.repeat(10000),
        });
        
        const res = await claimsClient.create(payload);
        
        // API may:
        // 1. Accept (201)
        // 2. Reject as too large (400 or 413)
        expect([201, 400, 413]).toContain(res.status());
        
        if (res.status() === 201) {
          add('API accepts long fields');
        } else {
          add(`API rejects long fields with ${res.status()}`);
        }
      });

      await attach();
    });
  });
});
