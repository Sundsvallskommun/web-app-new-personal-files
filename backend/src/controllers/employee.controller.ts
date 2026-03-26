import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { Controller, Get, Param, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { logger } from '@/utils/logger';
import { Employee, LoginName, PortalPersonData } from '@/interfaces/employee.interface';
import { hasPermissions } from '@/middlewares/permissions.middleware';
@Controller()
export class EmployeeController {
  private apiService = new ApiService();

  @Get('/portalpersondata/:personalNumber/guid')
  @OpenAPI({ summary: 'Fetch login name' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF', 'canReadOwnPF']))
  async guid(
    @Req() req: RequestWithUser,
    @Param('personalNumber') personalNumber: string,
    @Res() response: any,
  ): Promise<{ data: LoginName; message: string }> {
    const url = `citizen/3.0/2281/${personalNumber}/guid`;
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
    const url = `employee/2.0/2281/employed/${id}/accounts`;
    const res = await this.apiService.get<LoginName>({ url }, req.user).catch(e => {
      logger.error('Error when fetching login name');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }

  @Get('/portalpersondata/personal/:loginName')
  @OpenAPI({ summary: 'Fetch user information for given AD user' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF', 'canReadOwnPF']))
  async employee(
    @Req() req: RequestWithUser,
    @Param('loginName') loginName: string,
    @Res() response: PortalPersonData,
  ): Promise<{ data: PortalPersonData; message: string }> {
    const url = `employee/2.0/2281/portalpersondata/PERSONAL/${loginName}`;
    const res = await this.apiService.get<PortalPersonData>({ url }, req.user).catch(e => {
      logger.error('Error when fetching employee information');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }

  @Get('/portalpersondata/:personId/employeeUsersEmployments')
  @OpenAPI({ summary: 'Fetch employed user information' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF', 'canReadOwnPF']))
  async employeeUsersEmployments(
    @Req() req: RequestWithUser,
    @Param('personId') personId: string,
    @Res() response: Employee,
  ): Promise<{ data: Employee; message: string }> {
    const url = `employee/2.0/2281/employments?filter={"personId":"${personId}"}`;
    const res = await this.apiService.get<Employee>({ url }, req.user).catch(e => {
      logger.error('Error when fetching users employments');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }
}
