import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Base API client providing common HTTP methods and URL construction.
 * All API clients should extend this class to avoid duplication.
 */
export abstract class BaseApiClient {
  protected request: APIRequestContext;
  protected baseURL: string;

  constructor(request: APIRequestContext, baseURL?: string) {
    this.request = request;
    this.baseURL = baseURL?.replace(/\/$/, '') || '';
  }

  /**
   * Constructs full URL by combining baseURL with path
   */
  protected url(path: string): string {
    return `${this.baseURL}${path}`;
  }

  /**
   * Performs GET request
   */
  protected async get(path: string, options?: object): Promise<APIResponse> {
    return this.request.get(this.url(path), options);
  }

  /**
   * Performs POST request
   */
  protected async post(path: string, data: unknown): Promise<APIResponse> {
    return this.request.post(this.url(path), { data });
  }

  /**
   * Performs PATCH request
   */
  protected async patch(path: string, data: unknown): Promise<APIResponse> {
    return this.request.patch(this.url(path), { data });
  }

  /**
   * Performs PUT request
   */
  protected async put(path: string, data: unknown): Promise<APIResponse> {
    return this.request.put(this.url(path), { data });
  }

  /**
   * Performs DELETE request
   */
  protected async delete(path: string): Promise<APIResponse> {
    return this.request.delete(this.url(path));
  }
}
