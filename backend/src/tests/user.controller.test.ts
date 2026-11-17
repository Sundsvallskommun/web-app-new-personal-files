import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { UserController } from '@/controllers/user.controller';
import { User } from '@interfaces/users.interface';
import express from 'express';
import { useExpressServer } from 'routing-controllers';
import request from 'supertest';

const createAppWithSessionUser = (sessionUser: User) => {
  const app = express();
  app.use((req, _res, next) => {
    req.user = sessionUser;
    req.isAuthenticated = (() => true) as typeof req.isAuthenticated;
    next();
  });
  useExpressServer(app, { controllers: [UserController], defaultErrorHandler: false });
  return app;
};

const oidcSessionUser: User = {
  personId: 'person-id',
  name: 'Test Testsson',
  givenName: 'Test',
  surname: 'Testsson',
  email: 'test@example.com',
  username: 'tes01tes',
  workTitle: '',
  ADgroups: 'test_user',
  systemRole: 'pf_hr_user',
  accessToken: 'user-access-token',
  authenticationMethod: 'OIDC',
};

describe('UserController /me', () => {
  it('tells the client which authentication method the session was created with', async () => {
    const response = await request(createAppWithSessionUser(oidcSessionUser)).get('/me').expect(200);

    expect(response.body.data.authenticationMethod).toBe('OIDC');
  });

  it('never exposes the access token to the client', async () => {
    const response = await request(createAppWithSessionUser(oidcSessionUser)).get('/me').expect(200);

    expect(JSON.stringify(response.body)).not.toContain('user-access-token');
  });

  it('omits the authentication method for sessions created before it was recorded', async () => {
    const { authenticationMethod: _authenticationMethod, ...legacySessionUser } = oidcSessionUser;

    const response = await request(createAppWithSessionUser(legacySessionUser)).get('/me').expect(200);

    expect(response.body.data).not.toHaveProperty('authenticationMethod');
  });
});
