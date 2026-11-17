import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { InternalRole } from '@/interfaces/users.interface';
import { getPermissions } from '@/services/authorization.service';
import { SearchDocument } from '@/responses/document.response';

const { apiGet, apiPost } = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));

vi.mock('@/services/api.service', () => ({
  default: class {
    get = apiGet;
    post = apiPost;
  },
}));

import { DocumentController } from '@/controllers/document.controller';

const SELF = 'self-person-id';
const REPORT = 'report-person-id';
const STRANGER = 'stranger-person-id';

const OWNER_BY_REGISTRATION: Record<string, string | undefined> = {
  'REG-SELF': SELF,
  'REG-REPORT': REPORT,
  'REG-STRANGER': STRANGER,
  'REG-NO-PARTY': undefined,
  'REG-UNSIGNED-CONTRACT': SELF,
  'REG-SIGNED-CONTRACT': SELF,
};

const notFound = () => Object.assign(new Error('Not found'), { status: 404 });

const documentOf = (registrationNumber: string, partyId?: string) => ({
  registrationNumber,
  type: registrationNumber.endsWith('-CONTRACT') ? 'EMPLOYMENT_CONTRACT' : 'OTHER',
  metadataList: [
    ...(partyId ? [{ key: 'partyId', value: partyId }] : []),
    ...(registrationNumber === 'REG-SIGNED-CONTRACT' ? [{ key: 'signed', value: 'true' }] : []),
  ],
  documentData: [{ id: 'file-1' }],
});

beforeEach(() => {
  apiGet.mockReset();
  apiPost.mockReset();

  apiGet.mockImplementation(async ({ url }: { url: string }) => {
    if (url.includes('/manageremployees/')) return { data: { data: [{ personId: REPORT, employments: [] }] } };
    if (url.includes('/files/')) return { data: new ArrayBuffer(4) };

    const registrationNumber = /\/documents\/([^/?]+)/.exec(url)?.[1] ?? '';
    if (!(registrationNumber in OWNER_BY_REGISTRATION)) throw notFound();
    return { data: documentOf(registrationNumber, OWNER_BY_REGISTRATION[registrationNumber]) };
  });

  apiPost.mockImplementation(async ({ url }: { url: string }) => {
    if (url.endsWith('/documents/filter')) {
      return { data: { documents: [documentOf('REG-SELF', SELF), documentOf('REG-STRANGER', STRANGER)] } };
    }
    return { data: {} };
  });
});

const requestAs = (role: InternalRole): RequestWithUser =>
  ({
    user: {
      personId: SELF,
      username: 'self.user',
      name: 'Self User',
      givenName: 'Self',
      surname: 'User',
      email: '',
      workTitle: '',
      ADgroups: '',
      systemRole: role,
      permissions: getPermissions([role], true),
    },
  }) as RequestWithUser;

const search = (partyIds?: string[], overrides: Partial<SearchDocument> = {}): SearchDocument =>
  ({
    page: 1,
    limit: 100,
    sortDirection: 'ASC',
    includeConfidential: true,
    onlyLatestRevision: true,
    metaData: [
      { key: 'employmentId', matchesAny: ['1'] },
      ...(partyIds ? [{ key: 'partyId', matchesAny: partyIds }] : []),
    ],
    ...overrides,
  }) as SearchDocument;

const controller = new DocumentController();
const send = { send: (b64: string) => ({ data: b64, message: 'success' }) };

const filterCalls = () => apiPost.mock.calls.filter(([config]) => (config as { url: string }).url.endsWith('/filter'));
const fileFetches = () => apiGet.mock.calls.filter(([config]) => (config as { url: string }).url.includes('/files/'));

describe('POST /document/search', () => {
  it('lets pf_hr_user search their own documents', async () => {
    const res = await controller.getDocuments(requestAs('pf_hr_user'), search([SELF]));

    expect(res.data.documents?.map(d => d.registrationNumber)).toEqual(['REG-SELF']);
  });

  it('drops documents of anyone else that come back from the search', async () => {
    const res = await controller.getDocuments(requestAs('pf_hr_admin'), search([SELF]));

    expect(res.data.documents?.every(d => d.registrationNumber === 'REG-SELF')).toBe(true);
  });

  it("denies pf_hr_user someone else's partyId with 403", async () => {
    await expect(controller.getDocuments(requestAs('pf_hr_user'), search([STRANGER]))).rejects.toMatchObject({
      status: 403,
    });
    expect(filterCalls()).toHaveLength(0);
  });

  it.each<InternalRole>(['pf_hr_user', 'pf_hr_admin'])('answers 400 to %s searching without a partyId', async role => {
    await expect(controller.getDocuments(requestAs(role), search())).rejects.toMatchObject({ status: 400 });
  });

  it('answers 400 to a search naming several partyIds', async () => {
    await expect(controller.getDocuments(requestAs('pf_hr_admin'), search([SELF, REPORT]))).rejects.toMatchObject({
      status: 400,
    });
  });

  it('answers 400 when a second partyId hides in another filter', async () => {
    const body = search([SELF]);
    body.metaData?.push({ key: 'partyId', matchesAll: [STRANGER] });

    await expect(controller.getDocuments(requestAs('pf_hr_user'), body)).rejects.toMatchObject({ status: 400 });
  });

  it('answers 400 when the second partyId is spelled differently, as the document API ignores case', async () => {
    const body = search([SELF]);
    body.metaData?.push({ key: 'PARTYID', matchesAny: [STRANGER] });

    await expect(controller.getDocuments(requestAs('pf_hr_user'), body)).rejects.toMatchObject({ status: 400 });
  });

  it("lets a manager search a current report's documents", async () => {
    await expect(controller.getDocuments(requestAs('pf_hr_admin'), search([REPORT]))).resolves.toBeDefined();
  });

  it('denies a manager someone who is not a report', async () => {
    await expect(controller.getDocuments(requestAs('pf_hr_admin'), search([STRANGER]))).rejects.toMatchObject({
      status: 403,
    });
  });

  it.each<InternalRole>(['pf_hr_superuser', 'pf_hr_editor', 'pf_hr_superadmin'])(
    'lets %s search anyone, even without a partyId',
    async role => {
      const res = await controller.getDocuments(requestAs(role), search());

      expect(res.data.documents).toHaveLength(2);
    },
  );

  it('never asks downstream for confidential documents, whatever the client sent', async () => {
    await controller.getDocuments(requestAs('pf_hr_superuser'), search([SELF], { includeConfidential: true }));

    expect(filterCalls()[0][0].data.includeConfidential).toBe(false);
  });

  it("denies includeConfidential on someone else's documents", async () => {
    await expect(
      controller.getDocuments(requestAs('pf_hr_user'), search([STRANGER], { includeConfidential: true })),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('GET /document/:registrationNumber/files/:documentDataId', () => {
  it('lets pf_hr_user download their own document', async () => {
    await expect(controller.fetchDocument(requestAs('pf_hr_user'), 'REG-SELF', 'file-1', send)).resolves.toBeDefined();
  });

  it('excludes confidential documents in both the lookup and the download', async () => {
    await controller.fetchDocument(requestAs('pf_hr_superadmin'), 'REG-SELF', 'file-1', send);

    const urls = apiGet.mock.calls.map(([config]) => (config as { url: string }).url);
    expect(urls).toHaveLength(2);
    expect(urls.some(url => url.includes('includeConfidential'))).toBe(false);
  });

  it("denies pf_hr_user someone else's document before fetching the file", async () => {
    await expect(
      controller.fetchDocument(requestAs('pf_hr_user'), 'REG-STRANGER', 'file-1', send),
    ).rejects.toMatchObject({ status: 403 });
    expect(fileFetches()).toHaveLength(0);
  });

  it('gives the same answer for an unknown document as for a foreign one', async () => {
    const foreign = await controller.fetchDocument(requestAs('pf_hr_user'), 'REG-STRANGER', 'f', send).catch(e => e);
    const unknown = await controller.fetchDocument(requestAs('pf_hr_user'), 'REG-UNKNOWN', 'f', send).catch(e => e);

    expect({ status: unknown.status, message: unknown.message }).toEqual({
      status: foreign.status,
      message: foreign.message,
    });
  });

  it("denies another document's file requested through your own registration number", async () => {
    await expect(
      controller.fetchDocument(requestAs('pf_hr_user'), 'REG-SELF', 'file-of-someone-else', send),
    ).rejects.toMatchObject({ status: 403 });
    expect(fileFetches()).toHaveLength(0);
  });

  it('encodes the registration number, so it cannot point the call at another path', async () => {
    await expect(
      controller.fetchDocument(requestAs('pf_hr_superuser'), '../REG-SELF', 'file-1', send),
    ).rejects.toMatchObject({ status: 403 });

    expect(apiGet.mock.calls[0][0].url).toContain('/documents/..%2FREG-SELF');
    expect(fileFetches()).toHaveLength(0);
  });

  it('denies a document without a partyId', async () => {
    await expect(
      controller.fetchDocument(requestAs('pf_hr_admin'), 'REG-NO-PARTY', 'file-1', send),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("lets a manager download a report's document", async () => {
    await expect(
      controller.fetchDocument(requestAs('pf_hr_admin'), 'REG-REPORT', 'file-1', send),
    ).resolves.toBeDefined();
  });

  it('lets pf_hr_superuser download anyone’s document', async () => {
    await controller.fetchDocument(requestAs('pf_hr_superuser'), 'REG-STRANGER', 'file-1', send);

    expect(fileFetches()).toHaveLength(1);
  });

  it.each<InternalRole>(['pf_hr_user', 'pf_hr_superuser', 'pf_hr_superadmin'])(
    'refuses %s an unsigned employment contract, as the search hides it',
    async role => {
      await expect(
        controller.fetchDocument(requestAs(role), 'REG-UNSIGNED-CONTRACT', 'file-1', send),
      ).rejects.toMatchObject({ status: 403 });
      expect(fileFetches()).toHaveLength(0);
    },
  );

  it('allows a signed employment contract', async () => {
    await expect(
      controller.fetchDocument(requestAs('pf_hr_user'), 'REG-SIGNED-CONTRACT', 'file-1', send),
    ).resolves.toBeDefined();
  });
});

describe('POST /document/upload', () => {
  const file = { buffer: Buffer.from('x'), mimetype: 'text/plain', originalname: 'a.txt' } as Express.Multer.File;
  const uploadBody = (metadataList: { key: string; value: string }[]) => ({
    createdBy: 'someone.else',
    confidentiality: '{"confidential":false}',
    archive: false,
    description: '',
    metadataList: JSON.stringify(metadataList),
    type: 'OTHER',
  });

  it.each(['partyId', 'employmentId'])('answers 400 to metadata with more than one %s', async key => {
    const body = uploadBody([
      { key: 'partyId', value: REPORT },
      { key: 'employmentId', value: '7' },
      { key, value: 'second' },
    ]);

    await expect(controller.uploadDocument(requestAs('pf_hr_admin'), [file], body)).rejects.toMatchObject({
      status: 400,
    });
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('answers 400 to a second partyId spelled differently, as the document API ignores case', async () => {
    const body = uploadBody([
      { key: 'partyId', value: REPORT },
      { key: 'employmentId', value: '7' },
      { key: 'PartyId', value: STRANGER },
    ]);

    await expect(controller.uploadDocument(requestAs('pf_hr_admin'), [file], body)).rejects.toMatchObject({
      status: 400,
    });
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('takes createdBy from the session and ignores the one in the request', async () => {
    const body = uploadBody([{ key: 'partyId', value: STRANGER }]);

    await controller.uploadDocument(requestAs('pf_hr_editor'), [file], body);

    const sent = JSON.parse(apiPost.mock.calls[0][0].data.get('document'));
    expect(sent.createdBy).toBe('self.user');
  });
});
