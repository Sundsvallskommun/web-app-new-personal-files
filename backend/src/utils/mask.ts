export const maskPersonalNumber = (personalNumber: string): string => {
  const digits = String(personalNumber ?? '').replace(/\D/g, '');
  return digits.length > 4 ? `${digits.slice(0, -4)}****` : '****';
};
