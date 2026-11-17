import { MUNICIPALITYID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { User } from '@/interfaces/users.interface';
import ApiService from '@/services/api.service';
import { logger } from '@/utils/logger';
import { PortalPersonData } from '@/responses/employee.response';

const apiService = new ApiService();

export const resolvePersonId = async (loginName: string, personalNumber?: string): Promise<string> => {
  const user = { username: loginName } as User;

  if (loginName) {
    const url = `${getApiBase('employee')}/${MUNICIPALITYID}/portalpersondata/PERSONAL/${loginName}`;
    try {
      const res = await apiService.get<PortalPersonData>({ url }, user);
      if (res.data?.personid) {
        return res.data.personid;
      }
    } catch (error) {
      const safeLoginName = loginName.replace(/[\r\n]/g, '');
      logger.warn(`Could not resolve personId for ${safeLoginName} by login name: ${String(error)}`);
    }
  }

  if (!personalNumber) {
    return '';
  }

  const guidUrl = `${getApiBase('citizen')}/${MUNICIPALITYID}/${personalNumber}/guid`;
  return apiService
    .get<string>({ url: guidUrl }, user)
    .then(res => res.data ?? '')
    .catch(() => '');
};
