import { RequestWithUser } from '@/interfaces/auth.interface';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ApiService from '@services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { IsString } from 'class-validator';
import { Body, Controller, Get, Param, Post, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { formatOrgNr, OrgNumberFormat } from '@/utils/util';
import { logger } from '@/utils/logger';
import { Employee, LoginName, PortalPersonData } from '@/interfaces/employee.interface';
import { hasPermissions } from '@/middlewares/permissions.middleware';
@Controller()
export class EmployeeController {
  private apiService = new ApiService();

  @Get('/portalpersondata/:personalNumber/loginname')
  @OpenAPI({ summary: 'Fetch login name' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF']))
  async loginName(
    @Req() req: RequestWithUser,
    @Param('personalNumber') personalNumber: string,
    @Res() response: any,
  ): Promise<{ data: LoginName; message: string }> {
    const url = `employee/1.0/employed/${personalNumber}/loginname`;
    const res = await this.apiService.get<LoginName>({ url }, req.user).catch(e => {
      logger.error('Error when fetching login name');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }

  @Get('/portalpersondata/personal/:loginName')
  @OpenAPI({ summary: 'Fetch user information for given AD user' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF']))
  async employee(
    @Req() req: RequestWithUser,
    @Param('loginName') loginName: string,
    @Res() response: any,
  ): Promise<{ data: PortalPersonData; message: string }> {
    const url = `employee/1.0/portalpersondata/PERSONAL/${loginName}`;
    const res = await this.apiService.get<PortalPersonData>({ url }, req.user).catch(e => {
      logger.error('Error when fetching employee information');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }

  @Get('/portalpersondata/:personId/employeeUsersEmployments')
  @OpenAPI({ summary: 'Fetch employed user information' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF']))
  async employeeUsersEmployments(
    @Req() req: RequestWithUser,
    @Param('personId') personId: string,
    @Res() response: any,
  ): Promise<{ data: Employee; message: string }> {
    const url = `employee/1.0/employments?filter={"personId":"${personId}"}`;
    const res = await this.apiService.get<Employee>({ url }, req.user).catch(e => {
      logger.error('Error when fetching users employments');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }
}
