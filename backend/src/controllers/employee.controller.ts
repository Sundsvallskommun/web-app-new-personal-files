import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { Controller, Get, Param, QueryParam, QueryParams, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { logger } from '@/utils/logger';
import {
  Employee,
  LoginName,
  ManagerEmployeeDetailPagedOffsetResponse,
  PortalPersonData,
} from '@/interfaces/employee.interface';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import { getApiBase } from '@/config/api-config';
import { CACHE_TTL } from '@/utils/ttl-cache';
import { MUNICIPALITYID, COMPANY_ID } from '@/config';
import { HttpException } from '@/exceptions/HttpException';

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
  ): Promise<{ data: LoginName; message: string }> {
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
  async loginName(@Req() req: RequestWithUser, @Param('id') id: string): Promise<{ data: LoginName; message: string }> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/employed/${id}/accounts`;
    const res = await this.apiService.get<LoginName>({ url }, req.user).catch(e => {
      logger.error('Error when fetching login names');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }

  @Get('/getEmployeeByLoginName/:loginName')
  @OpenAPI({ summary: 'Fetch employee by loginName' })
  @UseBefore(authMiddleware)
  async getEmployeeInfo(
    @Req() req: RequestWithUser,
    @Param('loginName') loginName: string,
  ): Promise<{ data: PortalPersonData; message: string }> {
    if (!loginName) {
      throw new HttpException(400, 'Bad Request');
    }

    const url = `${this.apiBase}/${MUNICIPALITYID}/portalpersondata/PERSONAL/${loginName}`;
    const res = await this.apiService.get<PortalPersonData>({ url }, req.user, CACHE_TTL.PERSONDATA);
    return { data: res.data, message: 'success' };
  }

  @Get('/getemployments/:personId/employeeEmployments')
  @OpenAPI({ summary: 'Fetch employed user information' })
  @UseBefore(authMiddleware)
  async employeeEmployments(
    @Req() req: RequestWithUser,
    @Param('personId') personId: string,
    @Res() response: Employee[],
  ): Promise<{ data: Employee[]; message: string }> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/employments?CompanyId=${COMPANY_ID}&isManual=0&PersonId=${personId}`;
    const res = await this.apiService.get<Employee[]>({ url }, req.user, CACHE_TTL.PERSONDATA).catch(e => {
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
  ): Promise<{ data: ManagerEmployeeDetailPagedOffsetResponse; message: string }> {
    const query = new URLSearchParams();
    const { PageNumber, PageSize, OrderBy, OrderDirection, search } = queryParams;

    if (PageNumber !== undefined) query.append('PageNumber', String(PageNumber));
    if (PageSize !== undefined) query.append('PageSize', String(PageSize));
    if (OrderBy) query.append('OrderBy', OrderBy);
    if (OrderDirection) query.append('OrderDirection', OrderDirection);
    if (search) query.append('search', search);

    const url = `${this.apiBase}/${MUNICIPALITYID}/manageremployees/${managerId}/details?${query.toString()}`;

    const res = await this.apiService
      .get<ManagerEmployeeDetailPagedOffsetResponse>({ url }, req.user, CACHE_TTL.PERSONDATA)
      .catch(e => {
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
}
