import { getOidcConfiguration } from '@/oidc/oidc-client';
import type { Application } from 'express';
import request from 'supertest';

jest.mock('@/oidc/oidc-client', () => ({ loadOpenidClient: jest.fn(), getOidcConfiguration: jest.fn() }));

const createAppWithOidcFlag = (oidcEnabled: string): Application => {
  process.env.OIDC_ENABLED = oidcEnabled;
  let server: Application;
  jest.isolateModules(() => {
    const { default: App } = jest.requireActual<typeof import('@/app')>('@/app');
    server = new App([]).getServer();
  });
  return server;
};

const COLD_APP_START_TIMEOUT_MS = 120_000;

describe('App authentication routes', () => {
  beforeAll(() => {
    createAppWithOidcFlag('false');
  }, COLD_APP_START_TIMEOUT_MS);

  beforeEach(() => {
    jest.mocked(getOidcConfiguration).mockRejectedValue(new Error('IdP unreachable'));
  });

  afterEach(() => {
    delete process.env.OIDC_ENABLED;
  });

  it('does not expose the OIDC routes when OIDC is disabled', async () => {
    await request(createAppWithOidcFlag('false')).get('/api/oidc/login').expect(404);
  });

  it('exposes the OIDC routes when OIDC is enabled', async () => {
    const response = await request(createAppWithOidcFlag('true')).get('/api/oidc/login').expect(302);

    expect(response.headers.location).toBe('http://localhost:3000/?failMessage=OIDC_DISCOVERY_FAILED');
  });

  it.each(['false', 'true'])('keeps the SAML login redirect to the IdP when OIDC_ENABLED is %s', async oidcEnabled => {
    const response = await request(createAppWithOidcFlag(oidcEnabled)).get('/api/saml/login').expect(302);

    expect(response.headers.location).toMatch(/^http:\/\/idp\.test\/sso\?SAMLRequest=/);
  });
});
