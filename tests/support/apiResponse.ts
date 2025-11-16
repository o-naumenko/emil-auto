import { expect, APIResponse } from '@playwright/test';

/**
 * Wrapper class for API responses providing chainable assertion methods
 * and easy access to response data.
 */
export class ApiResponseWrapper<T = unknown> {
  constructor(private response: APIResponse) {}

  /**
   * Assert response status code
   */
  async expectStatus(code: number): Promise<this> {
    expect(this.response.status()).toBe(code);
    return this;
  }

  /**
   * Assert response has JSON content-type
   */
  async expectJson(): Promise<this> {
    const headers = this.response.headers();
    const ct = headers['content-type'] || headers['Content-Type'] || '';
    expect(ct).toContain('application/json');
    return this;
  }

  /**
   * Assert response status is 2xx
   */
  async expectSuccess(): Promise<this> {
    expect(this.response.ok()).toBeTruthy();
    return this;
  }

  /**
   * Get response body as JSON
   */
  async body(): Promise<T> {
    return this.response.json() as Promise<T>;
  }

  /**
   * Get response body as text
   */
  async text(): Promise<string> {
    return this.response.text();
  }

  /**
   * Get raw APIResponse object
   */
  raw(): APIResponse {
    return this.response;
  }

  /**
   * Get response status code
   */
  status(): number {
    return this.response.status();
  }

  /**
   * Get response headers
   */
  headers(): { [key: string]: string } {
    return this.response.headers();
  }

  /**
   * Assert response body contains text
   */
  async expectBodyContains(text: string): Promise<this> {
    const body = await this.text();
    expect(body).toContain(text);
    return this;
  }

  /**
   * Assert response body matches regex
   */
  async expectBodyMatches(pattern: RegExp): Promise<this> {
    const body = await this.text();
    expect(body).toMatch(pattern);
    return this;
  }
}

/**
 * Factory function to create ApiResponseWrapper
 */
export function wrapResponse<T = unknown>(response: APIResponse): ApiResponseWrapper<T> {
  return new ApiResponseWrapper<T>(response);
}
