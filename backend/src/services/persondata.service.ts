import { MUNICIPALITYID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { PortalPersonData } from '@/interfaces/employee.interface';
import { User } from '@/interfaces/users.interface';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';

const apiService = new ApiService();
const apiBase = getApiBase('employee');

export const resolvePersonIdByLoginName = async (loginName: string): Promise<string> => {
  if (!loginName) {
    return '';
  }

  const url = `${apiBase}/${MUNICIPALITYID}/portalpersondata/PERSONAL/${loginName}`;

  try {
    const res = await apiService.get<PortalPersonData>({ url }, { username: loginName } as User);
    return res.data?.personid ?? '';
  } catch (error) {
    const safeLoginName = loginName.replace(/[\r\n]/g, '');
    logger.warn(`Could not resolve personId for ${safeLoginName} at login: ${String(error)}`);
    return '';
  }
};
