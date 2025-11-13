// A small client wrapping Playwright's APIRequestContext to interact with the Claims API
const { expect } = require('@playwright/test');

class ClaimsClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} baseURL
   */
  constructor(request, baseURL) {
    this.request = request;
    this.baseURL = baseURL?.replace(/\/$/, '') || '';
  }

  url(path) {
    return `${this.baseURL}${path}`;
  }

  async list(status) {
    const res = await this.request.get(this.url('/claims'), {
      params: status ? { status } : undefined,
    });
    expect(res.ok()).toBeTruthy();
    return res.json();
  }

  async get(id) {
    const res = await this.request.get(this.url(`/claims/${id}`));
    return res;
  }

  async create(createDto) {
    const res = await this.request.post(this.url('/claims'), { data: createDto });
    return res;
  }

  async updateStatus(id, status) {
    const res = await this.request.patch(this.url(`/claims/${id}`), { data: { status } });
    return res;
  }
}

module.exports = { ClaimsClient };
