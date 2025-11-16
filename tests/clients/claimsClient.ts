import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './baseClient';
import type { CreateClaimDto, CreateClaimDtoParams } from '../support/dtos';
import type { Claim } from '../types/claim';

/**
 * API client for Claims endpoints
 */
export class ClaimsClient extends BaseApiClient {
  static readonly CLAIMS_PATH = '/claims';

  constructor(request: APIRequestContext, baseURL?: string) {
    super(request, baseURL);
  }

  /**
   * List all claims, optionally filtered by status
   * @returns APIResponse to allow testing both success and error cases
   */
  async list(status?: string): Promise<APIResponse> {
    return this.get(ClaimsClient.CLAIMS_PATH, {
      params: status ? { status } : undefined,
    });
  }

  /**
   * Helper to list claims and return parsed array (for success cases)
   */
  async listAndParse(status?: string): Promise<Claim[]> {
    const res = await this.list(status);
    return res.json() as Promise<Claim[]>;
  }

  /**
   * Get a single claim by ID
   */
  async getById(id: number | string): Promise<APIResponse> {
    return this.get(`${ClaimsClient.CLAIMS_PATH}/${id}`);
  }

  /**
   * Create a new claim
   */
  async create(createDto: CreateClaimDto | CreateClaimDtoParams | Record<string, unknown>): Promise<APIResponse> {
    const payload = this.toPayload(createDto);
    return this.post(ClaimsClient.CLAIMS_PATH, payload);
  }

  /**
   * Update claim status
   */
  async updateStatus(id: number | string, status: string): Promise<APIResponse> {
    return this.patch(`${ClaimsClient.CLAIMS_PATH}/${id}`, { status });
  }

  /**
   * Convert DTO to plain object payload
   */
  private toPayload(dto: CreateClaimDto | CreateClaimDtoParams | Record<string, unknown>): Record<string, unknown> {
    if ('toJSON' in dto && typeof dto.toJSON === 'function') {
      return dto.toJSON();
    }
    return dto as Record<string, unknown>;
  }
}
