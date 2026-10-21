import 'reflect-metadata';
import express from 'express';
import type { AddressInfo } from 'net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { getPermissions } from '@/services/authorization.service';

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock('@/services/api.service', () => ({
  default: class {
    get = apiGet;
  },
}));

import { EmployeeController } from '@/controllers/employee.controller';
import { createPersonalNumberLookupLimiter } from '@/middlewares/rate-limit.middleware';
import { maskPersonalNumber } from '@/utils/mask';
import { logger } from '@/utils/logger';

const PERSONAL_NUMBER = '199001011234';

const superuser = {
  user: { username: 'hr.person', permissions: getPermissions(['pf_hr_superuser'], true) },
} as RequestWithUser;

beforeEach(() => {
  apiGet.mockReset();
  apiGet.mockResolvedValue({ data: 'some-person-id' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('maskPersonalNumber', () => {
  it.each([
    ['199001011234', '19900101****'],
    ['9001011234', '900101****'],
    ['19900101-1234', '19900101****'],
    ['123', '****'],
    ['', '****'],
  ])('masks %s as %s', (input, masked) => {
    expect(maskPersonalNumber(input)).toBe(masked);
  });
});

describe('GET /portalpersondata/:personalNumber/guid', () => {
  const controller = new EmployeeController();

  it('logs the lookup with the user and a masked personal number', async () => {
    const info = vi.spyOn(logger, 'info');

    await controller.guid(superuser, PERSONAL_NUMBER);

    expect(info).toHaveBeenCalledWith('Personal number lookup by hr.person: 19900101****');
    expect(info.mock.calls.flat().join(' ')).not.toContain(PERSONAL_NUMBER);
  });

  it.each(['19900101-1234', '../199001011234', '1990010112345', 'abc'])(
    'answers 400 to %s without calling downstream',
    async input => {
      await expect(controller.guid(superuser, input)).rejects.toMatchObject({ status: 400 });
      expect(apiGet).not.toHaveBeenCalled();
    },
  );
});

describe('createPersonalNumberLookupLimiter', () => {
  const callsUntil429 = async (sessionIds: string[]) => {
    const app = express();
    app.use((req, _res, next) => {
      Object.assign(req, { sessionID: req.headers['x-session'] });
      next();
    });
    app.get('/lookup', createPersonalNumberLookupLimiter(), (_req, res) => {
      res.send('ok');
    });

    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const { port } = server.address() as AddressInfo;

    try {
      const statuses: number[] = [];
      for (const session of sessionIds) {
        const response = await fetch(`http://127.0.0.1:${port}/lookup`, { headers: { 'x-session': session } });
        statuses.push(response.status);
      }
      return statuses;
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  };

  it('answers 429 once a session goes over 30 lookups', async () => {
    const statuses = await callsUntil429(Array(31).fill('session-a'));

    expect(statuses.slice(0, 30).every(status => status === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });

  it('counts each session separately', async () => {
    const statuses = await callsUntil429([...Array(31).fill('session-a'), 'session-b']);

    expect(statuses[30]).toBe(429);
    expect(statuses[31]).toBe(200);
  });
});
