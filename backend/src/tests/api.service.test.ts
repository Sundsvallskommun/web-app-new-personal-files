import { User } from '@interfaces/users.interface';
import ApiService from '@services/api.service';
import axios from 'axios';

jest.mock('axios', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), { isAxiosError: () => false }),
}));
jest.mock('@services/api-token.service', () => ({
  createApiTokenService: () => ({ getToken: async () => 'machine-token' }),
}));

const axiosRequest = axios as unknown as jest.Mock;
const headersOfLastUpstreamRequest = () => axiosRequest.mock.lastCall[0].headers;

describe('ApiService', () => {
  beforeEach(() => {
    axiosRequest.mockReset().mockResolvedValue({ data: 'ok' });
  });

  it.each(['get', 'post', 'patch', 'delete'] as const)(
    'forwards the OIDC access token of the user as X-JWT-Assertion next to the machine token on %s',
    async method => {
      const oidcUser = { username: 'tes01tes', accessToken: 'user-access-token' } as User;

      await new ApiService()[method]({ url: 'document/3.0/2281/documents' }, oidcUser);

      expect(headersOfLastUpstreamRequest()).toMatchObject({
        Authorization: 'Bearer machine-token',
        'X-JWT-Assertion': 'user-access-token',
      });
    },
  );

  it('sends no X-JWT-Assertion for a user without an access token, as after a SAML login', async () => {
    const samlUser = { username: 'tes01tes' } as User;

    await new ApiService().get({ url: 'document/3.0/2281/documents' }, samlUser);

    expect(headersOfLastUpstreamRequest()).toMatchObject({ Authorization: 'Bearer machine-token' });
    expect(headersOfLastUpstreamRequest()).not.toHaveProperty('X-JWT-Assertion');
  });
});
