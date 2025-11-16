import { test, expect, APIResponse } from '@playwright/test';
import { TEST_CONFIG } from '../config/test.config';

/**
 * Creates a step logger for attaching markdown test steps to reports
 */
export function createStepLogger(title: string) {
  const steps: string[] = [];
  const add = (s: string) => steps.push(`- ${s}`);
  
  async function attach() {
    const md = [`# Test steps: ${title}`, '', ...steps].join('\n');
    await test.info().attach('steps.md', {
      body: Buffer.from(md, 'utf-8'),
      contentType: 'text/markdown',
    });
  }
  
  return { add, attach };
}

/**
 * Get header value from response (case-insensitive)
 */
export function getHeader(res: APIResponse, name: string): string | undefined {
  const headers = res.headers();
  const lower = name.toLowerCase();
  return headers[lower] ?? headers[name] ?? headers[name.toUpperCase()];
}

/**
 * Assert response status is 201 Created
 */
export async function expect201(res: APIResponse): Promise<void> {
  expect(res.status()).toBe(201);
}

/**
 * Assert response status is 200 OK
 */
export async function expect200(res: APIResponse): Promise<void> {
  expect(res.status()).toBe(200);
}

/**
 * Assert response status is 400 Bad Request
 */
export async function expect400(res: APIResponse): Promise<void> {
  expect(res.status()).toBe(400);
}

/**
 * Assert response status is 404 Not Found
 */
export async function expect404(res: APIResponse): Promise<void> {
  expect(res.status()).toBe(404);
}

/**
 * Assert response has JSON content-type
 */
export async function expectJson(res: APIResponse): Promise<void> {
  const ct = getHeader(res, 'content-type');
  expect(ct).toContain('application/json');
}

/**
 * Assert response is 400 with required fields error (flexible matching)
 */
export async function expect400Required(res: APIResponse): Promise<void> {
  expect(res.status()).toBe(400);
  const text = await res.text();
  expect(text).toMatch(TEST_CONFIG.errorMessages.requiredFields);
}

/**
 * Verify a string is a recent ISO timestamp
 */
export function expectRecentISO(s: string, maxMs: number = 5 * 60 * 1000): void {
  expect(typeof s).toBe('string');
  const d = new Date(s);
  expect(Number.isNaN(d.getTime())).toBe(false);
  expect(Math.abs(Date.now() - d.getTime())).toBeLessThan(maxMs);
}

/**
 * Generate unique policy number using UUID
 */
export function uniquePolicy(suffix?: string): string {
  const id = crypto.randomUUID().substring(0, 8).toUpperCase();
  return `PN-${id}${suffix ? `-${suffix}` : ''}`;
}
