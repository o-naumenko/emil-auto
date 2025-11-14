import { expect, APIRequestContext, APIResponse } from '@playwright/test';
import type { CreateClaimDto } from '../support/dtos';

export class ClaimsClient {
  static CLAIMS_PATH = '/claims';

  private request: APIRequestContext;
  private baseURL: string;

  constructor(request: APIRequestContext, baseURL?: string) {
    this.request = request;
    this.baseURL = baseURL?.replace(/\/$/, '') || '';
  }

  private url(path: string): string {
    return `${this.baseURL}${path}`;
  }

  async list(status?: string): Promise<any> {
    const res = await this.request.get(this.url(ClaimsClient.CLAIMS_PATH), {
      params: status ? { status } : undefined,
    });
    expect(res.ok()).toBeTruthy();
    return res.json();
  }

  async get(id: number | string): Promise<APIResponse> {
    const res = await this.request.get(this.url(`${ClaimsClient.CLAIMS_PATH}/${id}`));
    return res;
  }

  async create(createDto: CreateClaimDto | Record<string, unknown>): Promise<APIResponse> {
    const payload = (createDto as any)?.toJSON ? (createDto as any).toJSON() : createDto;
    const res = await this.request.post(this.url(ClaimsClient.CLAIMS_PATH), { data: payload });
    return res;
  }

  async updateStatus(id: number | string, status: string): Promise<APIResponse> {
    const res = await this.request.patch(this.url(`${ClaimsClient.CLAIMS_PATH}/${id}`), { data: { status } });
    return res;
  }
}
