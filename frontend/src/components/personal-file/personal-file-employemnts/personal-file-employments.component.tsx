import { Employee } from '@interfaces/employee/employee';
import { useFoundationObjectStore } from '@services/foundation-object/foundation-object-service';
import { Accordion, Disclosure, Divider, FormLabel, Label, Spinner, Table } from '@sk-web-gui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { useDocumentStore } from '@services/document-service/document-service';
import { DocumentDataList, IDocument, MetaData } from '@interfaces/document/document';

export const PersonalFileEmployments: React.FC<{ employments: Employee[] }> = ({ employments }) => {
  const { t } = useTranslation();
  const getFormOfEmmployments = useFoundationObjectStore((s) => s.getFormOfEmployments);
  const formOfEmployments = useFoundationObjectStore((s) => s.formOfEmployments);
  const getCompanies = useFoundationObjectStore((s) => s.getCompanies);
  const companies = useFoundationObjectStore((s) => s.companies);
  const user = useUserStore((s) => s.user);
  const documentListIsLoading = useDocumentStore((s) => s.documentsIsLoading);
  const getDocumentList = useDocumentStore((s) => s.getDocumentList);
  const documentList = useDocumentStore((s) => s.documentList);
  const getDocumentTypes = useDocumentStore((s) => s.getDocumentTypes);
  const documentTypes = useDocumentStore((s) => s.documentTypes);
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const { CANREADOWNPF, CANREADOWNDOCS } = hasPermission(user);

  const pathName = usePathname();

  useEffect(() => {
    if (CANREADOWNPF) {
      getDocumentTypes();
      getCompanies();
      getFormOfEmmployments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const metadata: MetaData[] = [
      {
        key: 'partyId',
        matchesAny: [employments[0].personId || ''],
      },
    ];
    getDocumentList(metadata);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employments]);

  useEffect(() => {
    if (documentList && documentList.documents) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocuments(documentList.documents);
    }
  }, []);

  return (
    <section>
      {!pathName.includes('min') && (
        <Divider.Section className="mb-24">{t('common:ongoingEmployments')}</Divider.Section>
      )}
      {employments[0]?.employments ? (
        employments[0]?.employments.map((emp, idx) => {
          return (
            <Table key={`employment-${idx}`} background className="mb-16">
              <Table.Header>
                <Table.HeaderColumn>{emp.title}</Table.HeaderColumn>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Column className="flex-col flex-wrap">
                    <div className="flex justify-between gap-40 py-16 px-16 w-full">
                      <div className="flex flex-col gap-24">
                        <div className="flex flex-col">
                          <FormLabel className="mb-4">{t('common:workTitle')}</FormLabel>
                          <Label className="w-fit" inverted>
                            {emp.title}
                          </Label>
                        </div>
                        <div className="flex flex-col">
                          <FormLabel className="mb-4">{t('common:formOfEmployment')}</FormLabel>
                          <Label className="w-fit" inverted>
                            {formOfEmployments.length !== 0
                              ? formOfEmployments.find((x) => x?.foeId === emp?.formOfEmploymentId)?.description
                              : t('common:hourlyPaid')}
                          </Label>
                        </div>
                      </div>
                      <div className="flex flex-col gap-24">
                        <div className="flex flex-col">
                          <FormLabel>{t('common:municipality')}</FormLabel>
                          <p>
                            {companies.length !== 0
                              ? companies.find((x) => x?.companyId === emp?.companyId)?.displayName
                              : t('common:missingInformation')}
                          </p>
                        </div>
                        <div className="flex flex-col">
                          <FormLabel>{t('common:management')}</FormLabel>
                          <p>{emp.topOrgName}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-24">
                        <div className="flex flex-col">
                          <FormLabel>{t('common:unit')}</FormLabel>
                          <p>{emp.orgName}</p>
                        </div>
                        <div className="flex flex-col">
                          <FormLabel>{t('common:startDate')}</FormLabel>
                          <p>{dayjs(emp.startDate).format('YYYY-DD-MM')}</p>
                        </div>
                      </div>
                    </div>
                    {CANREADOWNDOCS && (
                      <Disclosure className="w-full px-16" variant="alt">
                        <Disclosure.Header>
                          <Disclosure.Title>
                            {documentListIsLoading ? (
                              <>
                                Dokument <Spinner size={2} />
                              </>
                            ) : documents?.length !== 0 ? (
                              `Dokument (${documents?.length})`
                            ) : (
                              'Dokument (0)'
                            )}
                          </Disclosure.Title>
                          <Disclosure.Button />
                        </Disclosure.Header>
                        <Disclosure.Content>
                          {documentListIsLoading ? (
                            <Spinner size={4} />
                          ) : documents && documents?.length !== 0 ? (
                            <div className="flex flex-col gap-8" data-cy="document-list">
                              {documents
                                .filter((doc) =>
                                  //IMPORTANT NOTE: change empRowId to employmentId before production
                                  doc.metadataList?.some((x) => x.key === 'employmentId' && x.value === emp.empRowId)
                                )
                                .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
                                .map((doc, idx) => (
                                  <div key={`doc-${idx}`}>dokument här</div>
                                ))}
                            </div>
                          ) : (
                            <span>Inga dokument att visa</span>
                          )}
                        </Disclosure.Content>
                      </Disclosure>
                    )}
                  </Table.Column>
                </Table.Row>
              </Table.Body>
            </Table>
          );
        })
      ) : (
        <p>{t('common:noEmploymentsToShow')}</p>
      )}
    </section>
  );
};
