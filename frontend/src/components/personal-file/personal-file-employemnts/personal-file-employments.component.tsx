import { Employee } from '@interfaces/employee/employee';
import { useFoundationObjectStore } from '@services/foundation-object/foundation-object-service';
import { Disclosure, Divider, FormLabel, Icon, Label, Spinner, Table } from '@sk-web-gui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { useDocumentStore } from '@services/document-service/document-service';
import { File } from 'lucide-react';
import { DocumentDataList, MetaData } from '@interfaces/document/document';

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
  const [documents, setDocuments] = useState<DocumentDataList[]>([]);
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
        matchesAny: [employments[0]?.personId || ''],
      },
    ];
    getDocumentList(metadata);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employments]);

  useEffect(() => {
    const list: DocumentDataList[] = [];
    if (documentList?.documents) {
      documentList.documents.forEach((document) => {
        const dateTime = () => {
          const date = dayjs(document.created).date();
          const month = new Date(document.created || '').toLocaleString('default', { month: 'long' });
          const year = dayjs(document.created).year();
          const time = dayjs(document.created).format('HH.mm');
          const dateTime = `${date} ${month} ${year} kl.${time}`;
          return dateTime;
        };

        if (document?.documentData?.length !== 0) {
          document?.documentData?.forEach((data) => {
            list.push({
              fileName: `${data.fileName} ${documentTypes && `(${documentTypes.find((x) => x.type === document.type)?.displayName})`}`,
              originalName: data.fileName || '',
              registrationNumber: document.registrationNumber || '',
              id: data.id || '',
              mimeType: data.mimeType || '',
              dateTime: dateTime(),
              createdOriginal: new Date(document.created || ''),
              employmentId: document?.metadataList?.find((x) => x.key === 'employmentId')?.value || '',
            });
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDocuments(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentList]);

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
                                {t('common:document')} <Spinner size={2} />
                              </>
                            ) : documents?.length !== 0 ? (
                              `${t('common:document')} (${documents?.length})`
                            ) : (
                              `${t('common:document')} (0)`
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
                                .filter(
                                  (doc) =>
                                    //IMPORTANT NOTE: change empRowId to employmentId before production
                                    //DOUBLE CHECK INTERFACE TYPES
                                    doc.employmentId === emp.empRowId
                                )
                                .sort((a, b) => b.createdOriginal?.getTime() - a.createdOriginal?.getTime())
                                .map((doc, idx) => (
                                  <div key={`doc-${idx}`}>
                                    <div className="flex justify-between items-center p-12">
                                      <div className="flex items-center gap-8">
                                        <div
                                          className={`self-center bg-vattjom-surface-accent w-44 h-44 flex flex-col justify-center items-center rounded`}
                                        >
                                          <Icon icon={<File />} size={24} />
                                        </div>
                                        <p>
                                          <strong className="block">{doc.fileName}</strong> {doc.dateTime}
                                        </p>
                                      </div>
                                    </div>
                                    {documents.length > 1 && idx !== documents.length - 1 ? <Divider /> : <></>}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <span>{t('common:noDocuments')}</span>
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
