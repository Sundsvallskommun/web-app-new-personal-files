import 'reflect-metadata';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  process.env.NODE_ENV = 'production';
  const { default: App } = await import('@/app');
  const { registeredControllers } = await import('@/registered-controllers');

  const app = new App(registeredControllers).getServer();
  app.get('/session-test', (req, res) => {
    Object.assign(req.session, { touched: true });
    res.send('ok');
  });

  await new Promise<void>(resolve => {
    server = app.listen(0, '127.0.0.1', () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}, 60_000);

afterAll(async () => {
  process.env.NODE_ENV = 'test';
  await new Promise<void>(resolve => server.close(() => resolve()));
});

describe('session cookie in production behind a TLS proxy', () => {
  const cookieBehindTls = async () => {
    const response = await fetch(`${baseUrl}/session-test`, { headers: { 'x-forwarded-proto': 'https' } });
    return response.headers.get('set-cookie') ?? '';
  };

  it('is set at all, which proves trust proxy reads X-Forwarded-Proto', async () => {
    expect(await cookieBehindTls()).toMatch(/^connect\.sid=/);
  });

  it('is HttpOnly, Secure and SameSite=Lax', async () => {
    const cookie = await cookieBehindTls();

    expect(cookie).toMatch(/;\s*HttpOnly/i);
    expect(cookie).toMatch(/;\s*Secure/i);
    expect(cookie).toMatch(/;\s*SameSite=Lax/i);
  });

  it('has no Max-Age or Expires, so it ends with the browser session', async () => {
    const cookie = await cookieBehindTls();

    expect(cookie).not.toMatch(/Max-Age/i);
    expect(cookie).not.toMatch(/Expires/i);
  });

  it('is not set over plain HTTP, since it is Secure', async () => {
    const response = await fetch(`${baseUrl}/session-test`);

    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
