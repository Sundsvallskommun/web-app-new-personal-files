'use client';

import { Employee } from '@interfaces/employee/employee';
import { useFoundationObjectStore } from '@services/foundation-object/foundation-object-service';
import { Divider, FormLabel, Label, Table } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { PersonalFileDocuments } from '../personal-file-documents/personal-file-documents.component';
import { PersonalFileDocumentsUpload } from '../personal-file-documents/personal-file-documents-upload.component';
import { hasSystemRole } from '@utils/has-system-role';
import { PATH } from '@utils/constants';

export const PersonalFileEmployments: React.FC<{ employee: Employee[] }> = ({ employee }) => {
  const { t } = useTranslation();
  const formOfEmployments = useFoundationObjectStore((s) => s.formOfEmployments);
  const companies = useFoundationObjectStore((s) => s.companies);
  const user = useUserStore((s) => s.user);
  const { CANREADOWNDOCS, CANUPLOAD } = hasPermission(user);
  const pathName = usePathname();

  const person = employee[0];
  const employments = person?.employments?.filter((e) => e.companyId === process.env.COMPANY_ID) ?? [];

  const { adminRole } = hasSystemRole(user);

  return (
    <section>
      {!pathName.includes('min') && (
        <Divider.Section className="mb-24">{t('common:ongoingEmployments')}</Divider.Section>
      )}
      {employments.length > 0 ? (
        employments.map((emp, idx) => {
          return (
            <Table key={`employment-${idx}`} background className="mb-16">
              <Table.Header>
                <Table.HeaderColumn>
                  <div className="flex justify-between items-center w-full">
                    <span>{emp.title}</span>
                    {((CANUPLOAD && !adminRole) || (adminRole && !pathName.includes(PATH.myPersonalFile))) && (
                      <PersonalFileDocumentsUpload emp={emp} personId={person.personId} />
                    )}
                  </div>
                </Table.HeaderColumn>
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
                    {CANREADOWNDOCS && <PersonalFileDocuments emp={emp} personId={person.personId} />}
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
