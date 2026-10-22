import { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const createPersonalNumberLookupLimiter = () =>
  rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 30,
    keyGenerator: (req: Request) =>
      (req.user as { username?: string } | undefined)?.username || req.sessionID || ipKeyGenerator(req.ip ?? ''),
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many personal number lookups, try again in a few minutes' },
  });
