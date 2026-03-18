import { RequestWithUser } from '@/interfaces/auth.interface';
import ApiService from '@services/api.service';
import authMiddleware from '@middlewares/auth.middleware';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, Res, UploadedFiles, UseBefore } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { logger } from '@/utils/logger';

import { validateRequestBody } from '@/utils/validate';
import { fileUploadOptions } from '@/utils/fileUploadOptions';
import { DocumentCreateRequest } from '@/data-contracts/document/data-contracts';
import { SearchDocument, DocumentType, DocumentData } from '@/responses/document.response';
import { CreateDocument } from '@/interfaces/document.interface';
import { hasPermissions } from '@/middlewares/permissions.middleware';

interface ResponseData {
  data: any;
  message: string;
}

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
    const url = 'document/3.0/2281/documents';
    const docData: DocumentCreateRequest = {
      createdBy: document.createdBy,
      confidentiality: JSON.parse(document.confidentiality) as Object,
      archive: document.archive as boolean,
      description: document.description,
      metadataList: JSON.parse(document.metadataList) as [],
      type: document.type,
    };
    const data = new FormData();
    if (files && files.length > 0) {
      const blob = new Blob([files[0].buffer], { type: files[0].mimetype });
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
  @UseBefore(authMiddleware, hasPermissions(['canReadDocs']))
  async getDocuments(@Req() req: RequestWithUser, @Body() documentData: SearchDocument): Promise<{ data: SearchDocument; message: string }> {
    await validateRequestBody(SearchDocument, documentData);

    const url = 'document/3.0/2281/documents/filter';
    const response = await this.apiService.post<any>({ url, data: documentData }, req.user).catch(e => {
      logger.error('document post error:', e);
      throw e;
    });
    return { data: response.data, message: `searched documents` };
  }

  @Get('/document/:registrationNumber/files/:documentDataId')
  @OpenAPI({ summary: 'Fetch document' })
  @UseBefore(authMiddleware, hasPermissions(['canReadDocs']))
  async fetchDocument(
    @Req() req: RequestWithUser,
    @Param('registrationNumber') registrationNumber: string,
    @Param('documentDataId') documentDataId: string,
    @Res() response: { send(b64: string): { data: string; message: string } },
  ): Promise<{ data: string; message: string }> {
    const url = `document/3.0/2281/documents/${registrationNumber}/files/${documentDataId}?includeConfidential=true`;
    const res = await this.apiService.get<ArrayBuffer>({ url, responseType: 'arraybuffer' }, req.user);
    const binaryString = Array.from(new Uint8Array(res.data), v => String.fromCharCode(v)).join('');
    const b64 = Buffer.from(binaryString, 'binary').toString('base64');
    return response.send(b64) as { data: string; message: string };
  }

  @Get('/document/types')
  @OpenAPI({ summary: 'Fetch document types' })
  @UseBefore(authMiddleware, hasPermissions(['canReadDocs']))
  async documentTypes(@Req() req: RequestWithUser, @Res() response: DocumentType): Promise<{ data: DocumentType; message: string }> {
    const url = `document/3.0/2281/admin/documenttypes`;
    const res = await this.apiService.get<DocumentType>({ url }, req.user).catch(e => {
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
    @Res() response: any,
  ): Promise<any> {
    const url = `document/3.0/2281/documents/${registrationNumber}/files/${documentDataId}`;
    const res = await this.apiService.delete({ url }, req.user);
    return response.status(200).send(res.data);
  }
}
