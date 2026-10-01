import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { Controller, Get, HttpError, Param, QueryParam, QueryParams, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { logger } from '@/utils/logger';
import {
  Employee,
  LoginName,
  ManagerEmployeeDetailMeta,
  PortalPersonData,
  EndedEmploymentEvent,
  EndedEmploymentEventApiResponse,
} from '@/responses/employee.response';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import { getApiBase } from '@/config/api-config';
import { MUNICIPALITYID, COMPANY_ID } from '@/config';
import { HttpException } from '@/exceptions/HttpException';
import ApiResponse from '@interfaces/api-service.interface';

class ManagerEmployeesQuery {
  @QueryParam('PageNumber')
  PageNumber?: number;
  @QueryParam('PageSize')
  PageSize?: number;
  @QueryParam('OrderBy')
  OrderBy?: string;
  @QueryParam('OrderDirection')
  OrderDirection?: string;
  @QueryParam('search')
  search?: string;
}

@Controller()
export class EmployeeController {
  private apiService = new ApiService();
  private apiBase = getApiBase('employee');
  private apiBaseCitizen = getApiBase('citizen');

  @Get('/portalpersondata/:personalNumber/guid')
  @OpenAPI({ summary: 'Fetch login name' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF', 'canReadOwnPF']))
  async guid(
    @Req() req: RequestWithUser,
    @Param('personalNumber') personalNumber: string,
  ): Promise<ApiResponse<LoginName>> {
    const url = `${this.apiBaseCitizen}/${MUNICIPALITYID}/${personalNumber}/guid`;
    const res = await this.apiService.get<LoginName>({ url }, req.user).catch(e => {
      logger.error('Error when fetching login name');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }

  @Get('/portalpersondata/:id/loginname')
  @OpenAPI({ summary: 'Fetch login name' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF', 'canReadOwnPF']))
  async loginName(@Req() req: RequestWithUser, @Param('id') id: string): Promise<ApiResponse<LoginName>> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/employed/${id}/accounts`;
    const res = await this.apiService.get<LoginName>({ url }, req.user).catch(e => {
      logger.error('Error when fetching login names');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }

  @Get('/getEmployeeByLoginName/:loginName')
  @OpenAPI({ summary: 'Fetch employee by loginName (falls back to employments via Citizen lookup on 404)' })
  @UseBefore(authMiddleware)
  async getEmployeeInfo(
    @Req() req: RequestWithUser,
    @Param('loginName') loginName: string,
  ): Promise<ApiResponse<PortalPersonData | Employee[]>> {
    if (!loginName) {
      throw new HttpException(400, 'Bad Request');
    }

    const portalPersonDataUrl = `${this.apiBase}/${MUNICIPALITYID}/portalpersondata/PERSONAL/${loginName}`;

    const getEmployeeByPersonalId = async (personalNumber: string) => {
      const guidUrl = `${this.apiBaseCitizen}/${MUNICIPALITYID}/${personalNumber}/guid`;
      const personId = (await this.apiService.get<string>({ url: guidUrl }, req.user)).data;

      if (personId) {
        const employmentsUrl = `${this.apiBase}/${MUNICIPALITYID}/employments?PersonId=${personId}`;
        const employmentsRes = await this.apiService.get<Employee[]>({ url: employmentsUrl }, req.user);

        return { data: employmentsRes.data, message: 'success' };
      }
    };

    try {
      const portalPersonDataRes = await this.apiService.get<PortalPersonData>({ url: portalPersonDataUrl }, req.user);
      return { data: portalPersonDataRes.data, message: 'success' };
    } catch (error: unknown) {
      const personalNumber = req.user?.personalNumber;
      if (error instanceof HttpError && error.httpCode === 404 && personalNumber) {
        const handleMissingUserName = await getEmployeeByPersonalId(personalNumber);
        if (handleMissingUserName) {
          return handleMissingUserName;
        }
      }

      throw error;
    }
  }

  @Get('/getemployments/:personId/employeeEmployments')
  @OpenAPI({ summary: 'Fetch employed user information' })
  @UseBefore(authMiddleware)
  async employeeEmployments(
    @Req() req: RequestWithUser,
    @Param('personId') personId: string,
  ): Promise<ApiResponse<Employee[]>> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/employments?CompanyId=${COMPANY_ID}&isManual=0&PersonId=${personId}`;
    const res = await this.apiService.get<Employee[]>({ url }, req.user).catch(e => {
      if (e.status === 404) {
        return { data: [], message: 'success' };
      }
      logger.error('Error when fetching users employments');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }

  @Get('/getmanageremployees/:managerId/details')
  @OpenAPI({ summary: 'Fetch manager employees' })
  @UseBefore(authMiddleware)
  async managerEmployees(
    @Req() req: RequestWithUser,
    @Param('managerId') managerId: string,
    @QueryParams() queryParams: ManagerEmployeesQuery,
  ): Promise<ApiResponse<ManagerEmployeeDetailMeta>> {
    const query = new URLSearchParams();
    const { PageNumber, PageSize, OrderBy, OrderDirection, search } = queryParams;

    if (PageNumber !== undefined) query.append('PageNumber', String(PageNumber));
    if (PageSize !== undefined) query.append('PageSize', String(PageSize));
    if (OrderBy) query.append('OrderBy', OrderBy);
    if (OrderDirection) query.append('OrderDirection', OrderDirection);
    if (search) query.append('search', search);

    const url = `${this.apiBase}/${MUNICIPALITYID}/manageremployees/${managerId}/details?${query.toString()}`;

    const res = await this.apiService.get<ManagerEmployeeDetailMeta>({ url }, req.user).catch(e => {
      logger.error('Error when fetching manager employees');
      throw e;
    });

    const dataWithMaskedBirthDate = {
      ...res.data,
      data: res.data.data?.map(employee => {
        return { ...employee, birthdate: '******' };
      }),
    };

    const managerEmployeeDetail = process.env.APP_ENV === 'test' ? dataWithMaskedBirthDate : res.data;

    return { data: managerEmployeeDetail, message: 'success' };
  }

  @Get('/endedEmployments/:personId')
  @OpenAPI({ summary: 'Fetch ended employments' })
  @ResponseSchema(EndedEmploymentEventApiResponse)
  @UseBefore(authMiddleware, hasPermissions(['canReadPF', 'canReadOwnPF']))
  async endedEmployments(
    @Req() req: RequestWithUser,
    @Param('personId') personId: string,
  ): Promise<EndedEmploymentEventApiResponse> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/${personId}/endedemployments`;
    const res = await this.apiService.get<EndedEmploymentEvent[]>({ url }, req.user).catch(e => {
      if (e.status === 404) {
        return { data: [], message: 'success' };
      }
      logger.error('Error when fetching ended user employments');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }
}
