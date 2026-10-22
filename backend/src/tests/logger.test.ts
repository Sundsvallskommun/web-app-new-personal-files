import { Writable } from 'stream';
import winston from 'winston';
import { describe, expect, it } from 'vitest';
import { logger, stream } from '@utils/logger';

const PERSONAL_NUMBER = '199001011234';
const GUID = '0b508a73-126b-4b2a-9f3c-5c29edbb07b2';

const captureOutput = async (log: () => void): Promise<string> => {
  const lines: string[] = [];
  const transport = new winston.transports.Stream({
    stream: new Writable({
      write(chunk, _encoding, done) {
        lines.push(chunk.toString());
        done();
      },
    }),
  });

  logger.add(transport);
  try {
    log();
    await new Promise(resolve => setImmediate(resolve));
  } finally {
    logger.remove(transport);
  }
  return lines.join('');
};

describe('logger', () => {
  it('masks personal numbers and GUIDs in any message', async () => {
    const output = await captureOutput(() =>
      logger.warn(`Manager x attempted to upload outside scope (partyId: ${GUID}) for ${PERSONAL_NUMBER}`),
    );

    expect(output).toContain('partyId: ********-****-****-****-************');
    expect(output).toContain('19900101****');
    expect(output).not.toContain(GUID);
    expect(output).not.toContain(PERSONAL_NUMBER);
  });

  it('masks the message of an error passed as a second argument', async () => {
    const output = await captureOutput(() =>
      logger.error('document post error:', new Error(`No person ${PERSONAL_NUMBER}`)),
    );

    expect(output).toContain('No person 19900101****');
    expect(output).not.toContain(PERSONAL_NUMBER);
  });

  it('masks the HTTP access log, which morgan writes through the same logger', async () => {
    const output = await captureOutput(() =>
      stream.write(`GET /api/portalpersondata/${PERSONAL_NUMBER}/guid 200 12 ms\n`),
    );

    expect(output).toContain('/api/portalpersondata/19900101****/guid');
    expect(output).not.toContain(PERSONAL_NUMBER);
  });
});
