export const maskPersonalNumber = (personalNumber: string): string => {
  const digits = String(personalNumber ?? '').replace(/\D/g, '');
  return digits.length > 4 ? `${digits.slice(0, -4)}****` : '****';
};

const PERSONAL_NUMBER = /(?<!\d)(\d{6}|\d{8})[-+]?\d{4}(?!\d)/g;
const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export const maskIdentifiers = (text: string): string =>
  String(text ?? '')
    .replace(GUID, '********-****-****-****-************')
    .replace(PERSONAL_NUMBER, '$1****');
