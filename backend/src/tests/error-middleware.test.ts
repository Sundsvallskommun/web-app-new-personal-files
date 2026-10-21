import { afterEach, describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';
import errorMiddleware from '@middlewares/error.middleware';
import { HttpException } from '@exceptions/HttpException';
import { logger } from '@utils/logger';

const PERSONAL_NUMBER = '199001011234';
const GUID = '0b508a73-126b-4b2a-9f3c-5c29edbb07b2';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('errorMiddleware', () => {
  const run = (path: string, message: string) => {
    const logged = vi.spyOn(logger, 'error').mockImplementation(() => logger);
    const printed = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const json = vi.fn();
    const res = { status: vi.fn(() => ({ json })) } as unknown as Response;

    errorMiddleware(new HttpException(404, message), { method: 'GET', path } as Request, res, vi.fn());

    return { lines: [...logged.mock.calls, ...printed.mock.calls].flat().join(' '), json };
  };

  it('masks personal numbers and GUIDs in both the path and the message it logs', () => {
    const { lines } = run(`/api/getemployments/${GUID}/employeeEmployments`, `No person ${PERSONAL_NUMBER}`);

    expect(lines).not.toContain(PERSONAL_NUMBER);
    expect(lines).not.toContain(GUID);
    expect(lines).toContain('No person 19900101****');
  });

  it('still sends the unmasked message to the caller', () => {
    const { json } = run('/api/x', `No person ${PERSONAL_NUMBER}`);

    expect(json).toHaveBeenCalledWith({ message: `No person ${PERSONAL_NUMBER}` });
  });
});
