import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SAML_ENTRY_SSO, SAML_SUCCESS_REDIRECT } from '@config';
import type { Application } from 'express';
import request from 'supertest';

const { getOidcConfiguration } = vi.hoisted(() => ({ getOidcConfiguration: vi.fn() }));

vi.mock('@/oidc/oidc-client', () => ({ loadOpenidClient: vi.fn(), getOidcConfiguration }));

const COLD_APP_START_TIMEOUT_MS = 120_000;

const createAppWithOidcFlag = async (oidcEnabled: string): Promise<Application> => {
  process.env.OIDC_ENABLED = oidcEnabled;
  vi.resetModules();
  const { default: App } = await import('@/app');
  return new App([]).getServer();
};

describe('App authentication routes', () => {
  beforeEach(() => {
    getOidcConfiguration.mockRejectedValue(new Error('IdP unreachable'));
  });

  afterEach(() => {
    delete process.env.OIDC_ENABLED;
  });

  it(
    'does not expose the OIDC routes when OIDC is disabled',
    async () => {
      await request(await createAppWithOidcFlag('false'))
        .get('/api/oidc/login')
        .expect(404);
    },
    COLD_APP_START_TIMEOUT_MS,
  );

  it('exposes the OIDC routes when OIDC is enabled', async () => {
    const response = await request(await createAppWithOidcFlag('true'))
      .get('/api/oidc/login')
      .expect(302);

    expect(response.headers.location).toBe(`${SAML_SUCCESS_REDIRECT}/?failMessage=OIDC_DISCOVERY_FAILED`);
  });

  it.each(['false', 'true'])('keeps the SAML login redirect to the IdP when OIDC_ENABLED is %s', async oidcEnabled => {
    const response = await request(await createAppWithOidcFlag(oidcEnabled))
      .get('/api/saml/login')
      .expect(302);

    expect(response.headers.location.startsWith(`${SAML_ENTRY_SSO}?SAMLRequest=`)).toBe(true);
  });
});
