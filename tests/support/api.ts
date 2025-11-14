import { ClaimsClient } from '../clients/claimsClient';

export async function createAndParse(client: ClaimsClient, payload: any) {
  const res = await client.create(payload);
  const body = await res.json();
  return { res, body } as const;
}

export async function getAndParse(client: ClaimsClient, id: number) {
  const res = await client.get(id);
  const body = await res.json();
  return { res, body } as const;
}
