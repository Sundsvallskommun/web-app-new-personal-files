import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { Body, Controller, Delete, Get, Param, Post, Req, Res, UploadedFiles, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { logger } from '@/utils/logger';
import { validateRequestBody } from '@/utils/validate';
import { fileUploadOptions } from '@/utils/fileUploadOptions';
import { DocumentCreateRequest, PagedDocumentResponse } from '@/data-contracts/document/data-contracts';
import { SearchDocument, DocumentType, Confidentiality } from '@/responses/document.response';
import { hasPermissions } from '@/middlewares/permissions.middleware';
import { MUNICIPALITYID } from '@/config';
import { getApiBase } from '@/config/api-config';
import { Response } from 'express';
import { HttpException } from '@/exceptions/HttpException';
import {
  assertCanReadDocument,
  assertCanReadDocumentsOf,
  isManagerDirectReport,
  isUnsignedContract,
  partyIdOf,
} from '@/services/access.service';

export interface CreateBodyDocument {
  confidentiality: string;
  archive: boolean;
  description: string;
  metadataList: string;
  type: string;
}

const partyIdsIn = (search: SearchDocument): string[] => {
  const filters = Array.isArray(search.metaData) ? search.metaData : [];
  const values = filters
    .filter(filter => String(filter?.key ?? '').toLowerCase() === 'partyid')
    .flatMap(filter => [
      ...(Array.isArray(filter.matchesAny) ? filter.matchesAny : []),
      ...(Array.isArray(filter.matchesAll) ? filter.matchesAll : []),
    ]);
  return [...new Set(values.map(String))];
};

const DOCUMENT_TYPE_DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  EMPLOYMENT_CONTRACT: 'Anställningsavtal, månadsavlönad',
  EMPLOYMENT_CERTIFICATE: 'Anställningsbevis, timavlönad',
};

@Controller()
@UseBefore(authMiddleware)
export class DocumentController {
  private readonly apiService = new ApiService();
  private readonly apiBase = getApiBase('document');

  @Post('/document/upload')
  @OpenAPI({ summary: 'Upload document' })
  @UseBefore(hasPermissions(['canUploadDocs']))
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
    for (const key of ['partyId', 'employmentId']) {
      if (metadataList.filter(m => m.key === key).length > 1) {
        throw new HttpException(400, `Document metadata may contain only one ${key}`);
      }
    }

    const isManagerOnly =
      req.user?.permissions?.canUploadDocs === true && req.user?.permissions?.canUploadAllDocs !== true;
    if (isManagerOnly) {
      const partyId = metadataList.find(m => m.key === 'partyId')?.value;
      const employmentId = metadataList.find(m => m.key === 'employmentId')?.value;
      if (!partyId) {
        throw new HttpException(400, 'Missing partyId in document metadata');
      } else if (!employmentId) {
        throw new HttpException(400, 'Missing employmentId in document metadata');
      }
      if (!(await isManagerDirectReport(req, partyId, employmentId))) {
        logger.error(
          `Manager ${req.user.username} attempted to upload outside scope (partyId: ${partyId}, employmentId: ${employmentId})`,
        );
        throw new HttpException(403, 'Forbidden: employment is not in your direct reports');
      }
    }

    const docData: DocumentCreateRequest = {
      createdBy: req.user.username,
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
  @UseBefore(hasPermissions(['canReadDocs', 'canReadOwnDocs']))
  async getDocuments(
    @Req() req: RequestWithUser,
    @Body() documentData: SearchDocument,
  ): Promise<{ data: PagedDocumentResponse; message: string }> {
    await validateRequestBody(SearchDocument, documentData);

    const readsAll = req.user?.permissions?.canReadAllDocs === true;
    const partyIds = partyIdsIn(documentData);
    if (!readsAll) {
      if (partyIds.length !== 1) {
        throw new HttpException(400, 'Search must name exactly one partyId');
      }
      await assertCanReadDocumentsOf(req, partyIds[0]);
    }

    const url = `${this.apiBase}/${MUNICIPALITYID}/documents/filter`;
    const response = await this.apiService
      .post<PagedDocumentResponse>({ url, data: { ...documentData, includeConfidential: true } }, req.user)
      .catch(e => {
        logger.error('Error when searching documents:', e);
        throw e;
      });

    const documents = (response.data.documents ?? [])
      .filter(document => readsAll || partyIdOf(document) === partyIds[0])
      .filter(document => !isUnsignedContract(document));
    return { data: { ...response.data, documents }, message: `searched documents` };
  }

  @Get('/document/:registrationNumber/files/:documentDataId')
  @OpenAPI({ summary: 'Fetch document' })
  @UseBefore(hasPermissions(['canReadDocs', 'canReadOwnDocs']))
  async fetchDocument(
    @Req() req: RequestWithUser,
    @Param('registrationNumber') registrationNumber: string,
    @Param('documentDataId') documentDataId: string,
    @Res() response: { send(b64: string): { data: string; message: string } },
  ): Promise<{ data: string; message: string }> {
    await assertCanReadDocument(req, registrationNumber, documentDataId);
    const url = `${this.apiBase}/${MUNICIPALITYID}/documents/${encodeURIComponent(registrationNumber)}/files/${encodeURIComponent(documentDataId)}?includeConfidential=true`;
    const res = await this.apiService.get<ArrayBuffer>({ url, responseType: 'arraybuffer' }, req.user);
    const b64 = Buffer.from(res.data).toString('base64');
    return response.send(b64);
  }

  @Get('/document/types')
  @OpenAPI({ summary: 'Fetch document types' })
  @UseBefore(hasPermissions(['canReadDocs', 'canReadOwnDocs']))
  async documentTypes(
    @Req() req: RequestWithUser,
    @Res() _response: DocumentType,
  ): Promise<{ data: DocumentType[]; message: string }> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/admin/documenttypes`;
    const res = await this.apiService.get<DocumentType[]>({ url }, req.user).catch(e => {
      logger.error('Error when fetching document types');
      throw e;
    });

    const data = (res.data ?? []).map(documentType => ({
      ...documentType,
      displayName: DOCUMENT_TYPE_DISPLAY_NAME_OVERRIDES[documentType.type] ?? documentType.displayName,
    }));

    return { data, message: 'success' };
  }

  @Delete('/document/:registrationNumber/files/:documentDataId')
  @OpenAPI({ summary: 'Remove document data from employment' })
  @UseBefore(hasPermissions(['canDeleteDocs']))
  async deleteDocument(
    @Req() req: RequestWithUser,
    @Param('registrationNumber') registrationNumber: string,
    @Param('documentDataId') documentDataId: string,
    @Res() response: Response,
  ): Promise<Response> {
    const url = `${this.apiBase}/${MUNICIPALITYID}/documents/${encodeURIComponent(registrationNumber)}/files/${encodeURIComponent(documentDataId)}`;
    const res = await this.apiService.delete({ url }, req.user);
    return response.status(200).send(res.data);
  }
}
