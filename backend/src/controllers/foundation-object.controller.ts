import { RequestWithUser } from '@/interfaces/auth.interface';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ApiService from '@services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { IsString } from 'class-validator';
import { Body, Controller, Get, Param, Post, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { formatOrgNr, OrgNumberFormat } from '@/utils/util';
import { logger } from '@/utils/logger';
import { CompaniesApiResponse, FormOfEmploymentsApiResponse } from '@/responses/foundation-object.response';
import { Company, FormOfEmployment } from '@/data-contracts/fo/data-contracts';
import { hasPermissions } from '@/middlewares/permissions.middleware';

@Controller()
export class FoundationObjectController {
  private apiService = new ApiService();

  @Get('/companies')
  @OpenAPI({ summary: 'Fetch all companies' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF']))
  async companies(@Req() req: RequestWithUser, @Res() response: CompaniesApiResponse): Promise<{ data: Company[]; message: string }> {
    const url = `fo/1.0/companies`;
    const res = await this.apiService.get<Company[]>({ url }, req.user).catch(e => {
      logger.error('Error when fetching companies');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }

  @Get('/formofemployments')
  @OpenAPI({ summary: 'Fetch all form of employments' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF']))
  async formOfEmployments(
    @Req() req: RequestWithUser,
    @Res() response: FormOfEmploymentsApiResponse,
  ): Promise<{ data: FormOfEmployment[]; message: string }> {
    const url = `fo/1.0/formofemployments`;
    const res = await this.apiService.get<FormOfEmployment[]>({ url }, req.user).catch(e => {
      logger.error('Error when fetching form of employments');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }
}
