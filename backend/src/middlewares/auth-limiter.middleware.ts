import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  message: 'För många autentiseringsförsök, försök igenom om 5 minuter',
  standardHeaders: true,
  legacyHeaders: false,
});
