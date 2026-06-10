import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { Controller, Get, Req, Res, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { logger } from '@/utils/logger';
import { CompaniesApiResponse, FormOfEmploymentsApiResponse } from '@/responses/foundation-object.response';
import { Company, FormOfEmployment } from '@/data-contracts/fo/data-contracts';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import { getApiBase } from '@/config/api-config';
import { CACHE_TTL } from '@/utils/ttl-cache';

@Controller()
export class FoundationObjectController {
  private apiService = new ApiService();
  private apiBase = getApiBase('fo');

  @Get('/companies')
  @OpenAPI({ summary: 'Fetch all companies' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF', 'canReadOwnPF']))
  async companies(
    @Req() req: RequestWithUser,
    @Res() response: CompaniesApiResponse,
  ): Promise<{ data: Company[]; message: string }> {
    const url = `${this.apiBase}/companies`;
    const res = await this.apiService.get<Company[]>({ url }, req.user, CACHE_TTL.REFERENCE).catch(e => {
      logger.error('Error when fetching companies');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }

  @Get('/formofemployments')
  @OpenAPI({ summary: 'Fetch all form of employments' })
  @UseBefore(authMiddleware, hasPermissions(['canReadPF', 'canReadOwnPF']))
  async formOfEmployments(
    @Req() req: RequestWithUser,
    @Res() response: FormOfEmploymentsApiResponse,
  ): Promise<{ data: FormOfEmployment[]; message: string }> {
    const url = `${this.apiBase}/formofemployments`;
    const res = await this.apiService.get<FormOfEmployment[]>({ url }, req.user, CACHE_TTL.REFERENCE).catch(e => {
      logger.error('Error when fetching form of employments');
      throw e;
    });
    return { data: res.data, message: 'success' };
  }
}
