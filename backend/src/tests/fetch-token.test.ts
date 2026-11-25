import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchApiToken } from '@utils/fetchToken';
import { logger } from '@utils/logger';
import { AxiosError } from 'axios';

const { tokenEndpoint } = vi.hoisted(() => ({ tokenEndpoint: vi.fn() }));

vi.mock('axios', async importOriginal => {
  const actual = await importOriginal<typeof import('axios')>();
  return { ...actual, default: Object.assign(tokenEndpoint, { isAxiosError: actual.default.isAxiosError }) };
});

const BASIC_CREDENTIALS = Buffer.from('test-client-key:test-client-secret').toString('base64');

const tlsFailureWithRequestConfig = () =>
  new AxiosError('unable to get local issuer certificate', 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY', {
    headers: { Authorization: `Basic ${BASIC_CREDENTIALS}` },
  } as never);

describe('fetchApiToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs why the machine token request failed without the client credentials', async () => {
    const loggedErrors = vi.spyOn(logger, 'error').mockImplementation(() => logger);
    tokenEndpoint.mockRejectedValue(tlsFailureWithRequestConfig());

    await expect(fetchApiToken()).rejects.toMatchObject({ status: 502 });

    const loggedMessage = String(loggedErrors.mock.calls[0][0]);
    expect(loggedMessage).toContain('UNABLE_TO_GET_ISSUER_CERT_LOCALLY');
    expect(loggedMessage).not.toContain(BASIC_CREDENTIALS);
    expect(loggedMessage).not.toContain('test-client-secret');
  });
});
