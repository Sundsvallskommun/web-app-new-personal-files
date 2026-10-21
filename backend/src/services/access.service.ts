import { MUNICIPALITYID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { Permissions } from '@/interfaces/users.interface';
import { Document } from '@/data-contracts/document/data-contracts';
import { ManagerEmployee, ManagerEmployeeDetailMeta } from '@/responses/employee.response';
import ApiService from '@/services/api.service';
import { resolvePersonId } from '@/services/persondata.service';
import { logger } from '@/utils/logger';

const apiService = new ApiService();

const statusOf = (error: unknown): number | undefined => {
  const candidate = error as { status?: unknown; httpCode?: unknown };
  const status = candidate?.status ?? candidate?.httpCode;
  return typeof status === 'number' ? status : undefined;
};

const deny = (req: RequestWithUser, reason: string): never => {
  logger.warn(`Access denied for ${req.user?.username ?? 'unknown user'}: ${reason}`);
  throw new HttpException(403, 'Forbidden');
};

type SessionWithUser = { passport?: { user?: { personId?: string } } };

const rememberPersonId = (req: RequestWithUser, personId: string): void => {
  req.user.personId = personId;
  const sessionUser = (req.session as SessionWithUser | undefined)?.passport?.user;
  if (sessionUser) {
    sessionUser.personId = personId;
  }
};

export const getActingPersonId = async (req: RequestWithUser): Promise<string> => {
  if (req.user?.personId) {
    return req.user.personId;
  }

  const personId = await resolvePersonId(req.user?.username ?? '', req.user?.personalNumber);
  if (!personId) {
    deny(req, 'could not resolve own personId');
  }

  rememberPersonId(req, personId);
  return personId;
};

export const getManagerReports = async (req: RequestWithUser): Promise<ManagerEmployee[]> => {
  const managerId = await getActingPersonId(req);
  const url = `${getApiBase('employee')}/${MUNICIPALITYID}/manageremployees/${managerId}/details?PageNumber=1&PageSize=1000`;

  try {
    const res = await apiService.get<ManagerEmployeeDetailMeta>({ url }, req.user);
    return res.data.data ?? [];
  } catch (error) {
    if (statusOf(error) === 404) {
      return [];
    }
    throw error;
  }
};

const assertCanRead = async (
  req: RequestWithUser,
  personId: string,
  readAll: keyof Permissions,
  readReports: keyof Permissions,
): Promise<void> => {
  if (req.user?.permissions?.[readAll]) {
    return;
  }

  if (personId && personId === (await getActingPersonId(req))) {
    return;
  }

  if (req.user?.permissions?.[readReports]) {
    const reports = await getManagerReports(req);
    if (reports.some(report => report.personId === personId)) {
      return;
    }
  }

  deny(req, 'person is neither self nor a current direct report');
};

export const assertCanReadPerson = (req: RequestWithUser, personId: string): Promise<void> =>
  assertCanRead(req, personId, 'canReadAllPF', 'canReadPF');

export const assertCanReadDocumentsOf = (req: RequestWithUser, partyId: string): Promise<void> =>
  assertCanRead(req, partyId, 'canReadAllDocs', 'canReadDocs');

export const partyIdOf = (document: Document): string =>
  document.metadataList?.find(metadata => metadata.key === 'partyId')?.value ?? '';

export const isUnsignedContract = (document: Document): boolean =>
  document.type === 'EMPLOYMENT_CONTRACT' &&
  !(document.metadataList ?? []).some(metadata => metadata.key === 'signed' && metadata.value === 'true');

export const assertCanReadDocument = async (
  req: RequestWithUser,
  registrationNumber: string,
  documentDataId: string,
): Promise<void> => {
  const url = `${getApiBase('document')}/${MUNICIPALITYID}/documents/${encodeURIComponent(registrationNumber)}`;
  const document = await apiService
    .get<Document>({ url }, req.user)
    .then(res => res.data)
    .catch(error => {
      const status = statusOf(error);
      if (status === 404 || status === 403) {
        deny(req, 'document not found');
      }
      throw error;
    });

  if (!(document.documentData ?? []).some(data => data.id === documentDataId)) {
    deny(req, 'file does not belong to the document');
  }

  if (isUnsignedContract(document)) {
    deny(req, 'employment contract is not signed');
  }

  if (req.user?.permissions?.canReadAllDocs) {
    return;
  }

  const partyId = partyIdOf(document);
  if (!partyId) {
    deny(req, 'document has no partyId');
  }

  await assertCanReadDocumentsOf(req, partyId);
};

export const isManagerDirectReport = async (
  req: RequestWithUser,
  partyId: string,
  employmentId: string,
): Promise<boolean> => {
  const report = (await getManagerReports(req)).find(r => r.personId === partyId);
  return (report?.employments ?? []).some(e => String(e.employmentId) === String(employmentId));
};
