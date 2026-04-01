import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { Controller, Get, Header, Param, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { logger } from '@/utils/logger';
import { Employee, LoginName, PortalPersonData } from '@/interfaces/employee.interface';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import { getApiBase } from '@/config/api-config';
import { MUNICIPALITYID } from '@/config';
import { PortalPersonDataApiResponse } from '@/responses/employee.response';
import { HttpException } from '@/exceptions/HttpException';

interface ResponseData<T> {
  data: T;
  message: string;
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
    @Res() response: any,
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
  async loginName(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Res() response: any,
  ): Promise<{ data: LoginName; message: string }> {
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
    const res = await this.apiService.get<PortalPersonData>({ url }, req.user);
    return { data: res.data, message: 'success' };
  }

  @Get('/getemployments/:personId/employeeUsersEmployments')
  @OpenAPI({ summary: 'Fetch employed user information' })
  @UseBefore(authMiddleware)
  async employeeUsersEmployments(
    @Req() req: RequestWithUser,
    @Param('personId') personId: string,
    @Res() response: Employee[],
  ): Promise<{ data: Employee[]; message: string }> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/employments?HireDateFrom=1959-01-01&HireDateTo=2999-01-01&PersonId=${personId}`;
    const res = await this.apiService.get<Employee[]>({ url }, req.user).catch(e => {
      logger.error('Error when fetching users employments');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }
}
