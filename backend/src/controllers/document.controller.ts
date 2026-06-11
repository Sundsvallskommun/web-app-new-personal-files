import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { Body, Controller, Delete, Get, Param, Post, Req, Res, UploadedFiles, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { logger } from '@/utils/logger';

import { validateRequestBody } from '@/utils/validate';
import { fileUploadOptions } from '@/utils/fileUploadOptions';
import { DocumentCreateRequest } from '@/data-contracts/document/data-contracts';
import { SearchDocument, DocumentType, Confidentiality } from '@/responses/document.response';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import { MUNICIPALITYID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { CACHE_TTL } from '@/utils/ttl-cache';
import { Response } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import { ManagerEmployeeDetailPagedOffsetResponse, PortalPersonData } from '@/interfaces/employee.interface';

export interface CreateBodyDocument {
  createdBy: string;
  confidentiality: string;
  archive: boolean;
  description: string;
  metadataList: string;
  type: string;
}
@Controller()
export class DocumentController {
  private apiService = new ApiService();
  private apiBase = getApiBase('document');
  private readonly employeeApiBase = getApiBase('employee');

  private async isManagerDirectReport(req: RequestWithUser, partyId: string): Promise<boolean> {
    const username = req.user?.username;
    if (!username) {
      throw new HttpException(403, 'Forbidden');
    }

    const portalPersonDataUrl = `${this.employeeApiBase}/${MUNICIPALITYID}/portalpersondata/PERSONAL/${username}`;
    const managerId = await this.apiService
      .get<PortalPersonData>({ url: portalPersonDataUrl }, req.user)
      .then(res => res.data.personid)
      .catch(e => {
        logger.error('Failed to resolve manager personId during upload:', e);
        throw new HttpException(403, 'Forbidden');
      });

    if (!managerId) {
      throw new HttpException(403, 'Forbidden');
    }

    const reportsUrl = `${this.employeeApiBase}/${MUNICIPALITYID}/manageremployees/${managerId}/details?PageNumber=1&PageSize=1000`;
    const reports = await this.apiService
      .get<ManagerEmployeeDetailPagedOffsetResponse>({ url: reportsUrl }, req.user)
      .then(res => res.data.data ?? [])
      .catch(e => {
        logger.error('Failed to fetch manager direct reports during upload:', e);
        throw new HttpException(403, 'Forbidden');
      });

    return reports.some(emp => emp.personId === partyId);
  }

  @Post('/document/upload')
  @OpenAPI({ summary: 'Upload document' })
  @UseBefore(authMiddleware, hasPermissions(['canUploadDocs']))
  async uploadDocument(
    @Req() req: RequestWithUser,
    @UploadedFiles('documentFiles', { options: fileUploadOptions, required: false }) files: Express.Multer.File[],
    @Body() document: CreateBodyDocument,
  ): Promise<{
    data: {
      document: DocumentCreateRequest;
      documentFiles: File[];
    };
    message: string;
  }> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/documents`;
    const metadataList = JSON.parse(document.metadataList) as { key: string; value: string }[];

    const isManagerOnly =
      req.user?.permissions?.canUploadDocs === true && req.user?.permissions?.canDeleteDocs !== true;
    if (isManagerOnly) {
      const partyId = metadataList.find(m => m.key === 'partyId')?.value;
      if (!partyId) {
        throw new HttpException(400, 'Missing partyId in document metadata');
      }
      if (!(await this.isManagerDirectReport(req, partyId))) {
        logger.error(`Chef ${req.user.username} attempted to upload outside scope (partyId: ${partyId})`);
        throw new HttpException(403, 'Forbidden: employee is not in your direct reports');
      }
    }

    const docData: DocumentCreateRequest = {
      createdBy: document.createdBy,
      confidentiality: JSON.parse(document.confidentiality) as Confidentiality,
      archive: document.archive as boolean,
      description: document.description,
      metadataList: metadataList,
      type: document.type,
    };
    const data = new FormData();
    if (files && files.length > 0) {
      const uint8 = new Uint8Array(files[0].buffer);
      const blob = new Blob([uint8], { type: files[0].mimetype });
      data.append(`documentFiles`, blob, files[0].originalname);
      data.append('document', JSON.stringify(docData));
    } else {
      logger.error('Trying to save attachment without name or data');
      throw new Error('File missing');
    }

    const response = await this.apiService
      .post<{ document: DocumentCreateRequest; documentFiles: File[] }>(
        {
          url,
          data,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
        req.user,
      )
      .catch(e => {
        logger.error('document post error:', e);
        throw e;
      });
    return { data: response.data, message: `document uploaded on employment` };
  }

  @Post('/document/search')
  @OpenAPI({ summary: 'Fetch documents on employment' })
  @UseBefore(authMiddleware, hasPermissions(['canReadDocs', 'canReadOwnDocs']))
  async getDocuments(
    @Req() req: RequestWithUser,
    @Body() documentData: SearchDocument,
  ): Promise<{ data: SearchDocument; message: string }> {
    await validateRequestBody(SearchDocument, documentData);

    const url = `${this.apiBase}/${MUNICIPALITYID}/documents/filter`;
    // coalesce: identical concurrent searches (e.g. StrictMode double-fire) share one upstream call.
    // staleCacheOnly: always revalidate (so a just-uploaded doc shows immediately) but keep the last good
    // result so a throttled document API serves the stale list instead of a 429.
    const response = await this.apiService
      .post<any>({ url, data: documentData }, req.user, true, CACHE_TTL.PERSONDATA, true)
      .catch(e => {
        logger.error('document post error:', e);
        throw e;
      });
    return { data: response.data, message: `searched documents` };
  }

  @Get('/document/:registrationNumber/files/:documentDataId')
  @OpenAPI({ summary: 'Fetch document' })
  @UseBefore(authMiddleware, hasPermissions(['canReadDocs', 'canReadOwnDocs']))
  async fetchDocument(
    @Req() req: RequestWithUser,
    @Param('registrationNumber') registrationNumber: string,
    @Param('documentDataId') documentDataId: string,
    @Res() response: { send(b64: string): { data: string; message: string } },
  ): Promise<{ data: string; message: string }> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/documents/${registrationNumber}/files/${documentDataId}?includeConfidential=true`;
    const res = await this.apiService.get<ArrayBuffer>({ url, responseType: 'arraybuffer' }, req.user);
    const binaryString = Array.from(new Uint8Array(res.data), v => String.fromCharCode(v)).join('');
    const b64 = Buffer.from(binaryString, 'binary').toString('base64');
    return response.send(b64);
  }

  @Get('/document/types')
  @OpenAPI({ summary: 'Fetch document types' })
  @UseBefore(authMiddleware, hasPermissions(['canReadDocs', 'canReadOwnDocs']))
  async documentTypes(
    @Req() req: RequestWithUser,
    @Res() _response: DocumentType,
  ): Promise<{ data: DocumentType; message: string }> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/admin/documenttypes`;
    const res = await this.apiService.get<DocumentType>({ url }, req.user, CACHE_TTL.REFERENCE).catch(e => {
      logger.error('Error when fetching document types');
      throw e;
    });

    return { data: res.data, message: 'success' };
  }

  @Delete('/document/:registrationNumber/files/:documentDataId')
  @OpenAPI({ summary: 'Delete document data from employment' })
  @UseBefore(authMiddleware, hasPermissions(['canDeleteDocs']))
  async deleteDocument(
    @Req() req: RequestWithUser,
    @Param('registrationNumber') registrationNumber: string,
    @Param('documentDataId') documentDataId: string,
    @Res() response: Response,
  ): Promise<Response> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/documents/${registrationNumber}/files/${documentDataId}`;
    const res = await this.apiService.delete({ url }, req.user);
    return response.status(200).send(res.data);
  }
}
