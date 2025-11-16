import { APIResponse } from '@playwright/test';
import { ClaimsClient } from '../clients/claimsClient';
import type { Claim } from '../types/claim';
import type { CreateClaimDto, CreateClaimDtoParams } from './dtos';

/**
 * Create a claim and return both response and parsed body
 */
export async function createAndParse(
  client: ClaimsClient,
  payload: CreateClaimDto | CreateClaimDtoParams | Record<string, unknown>
): Promise<{ res: APIResponse; body: Claim }> {
  const res = await client.create(payload);
  const body = await res.json();
  return { res, body };
}

/**
 * Get a claim by ID and return both response and parsed body
 */
export async function getAndParse(
  client: ClaimsClient,
  id: number
): Promise<{ res: APIResponse; body: Claim }> {
  const res = await client.getById(id);
  const body = await res.json();
  return { res, body };
}
