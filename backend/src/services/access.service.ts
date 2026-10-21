import { MUNICIPALITYID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithUser } from '@/interfaces/auth.interface';
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

export const assertCanReadPerson = async (req: RequestWithUser, personId: string): Promise<void> => {
  if (req.user?.permissions?.canReadAllPF) {
    return;
  }

  if (personId && personId === (await getActingPersonId(req))) {
    return;
  }

  if (req.user?.permissions?.canReadPF) {
    const reports = await getManagerReports(req);
    if (reports.some(report => report.personId === personId)) {
      return;
    }
  }

  deny(req, 'person is neither self nor a current direct report');
};

export const isManagerDirectReport = async (
  req: RequestWithUser,
  partyId: string,
  employmentId: string,
): Promise<boolean> => {
  const report = (await getManagerReports(req)).find(r => r.personId === partyId);
  return (report?.employments ?? []).some(e => String(e.employmentId) === String(employmentId));
};
