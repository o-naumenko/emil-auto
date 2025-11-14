import { test, expect, APIResponse } from '@playwright/test';

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

export function getHeader(res: APIResponse, name: string) {
  const headers = res.headers();
  const lower = name.toLowerCase();
  return headers[lower] ?? headers[name] ?? headers[name.toUpperCase()];
}

export async function expect201(res: APIResponse) {
  expect(res.status()).toBe(201);
}

export async function expectJson(res: APIResponse) {
  const ct = getHeader(res, 'content-type');
  expect(ct).toContain('application/json');
}

export async function expect400Required(res: APIResponse) {
  expect(res.status()).toBe(400);
  const text = await res.text();
  expect(text).toContain('policyNumber, claimantName, damageDate, and lossDescription are required');
}

export function expectRecentISO(s: string, maxMs = 5 * 60 * 1000) {
  expect(typeof s).toBe('string');
  const d = new Date(s);
  expect(Number.isNaN(d.getTime())).toBe(false);
  expect(Math.abs(Date.now() - d.getTime())).toBeLessThan(maxMs);
}

export function uniquePolicy(suffix?: string) {
  return `PN-${Date.now()}${suffix ? `-${suffix}` : ''}`;
}
