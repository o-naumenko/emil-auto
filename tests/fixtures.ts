import { test as base, expect, APIRequestContext } from '@playwright/test';
import { ClaimsClient } from './clients/claimsClient';

type Fixtures = {
  claimsClient: ClaimsClient;
};

export const test = base.extend<Fixtures>({
  claimsClient: async ({ request, baseURL }, use) => {
    const client = new ClaimsClient(request as APIRequestContext, baseURL);
    await use(client);
  },
});

export { expect };
