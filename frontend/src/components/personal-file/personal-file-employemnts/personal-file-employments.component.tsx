import { Employee } from '@interfaces/employee/employee';
import { useFoundationObjectStore } from '@services/foundation-object/foundation-object-service';
import { Divider, FormLabel, Label, Table } from '@sk-web-gui/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { PATH } from '@utils/constants';
import { usePathname } from 'next/navigation';

export const PersonalFileEmployments: React.FC<{ employments: Employee[] }> = ({ employments }) => {
  const { t } = useTranslation();
  const getFormOfEmmployments = useFoundationObjectStore((s) => s.getFormOfEmployments);
  const formOfEmployments = useFoundationObjectStore((s) => s.formOfEmployments);
  const getCompanies = useFoundationObjectStore((s) => s.getCompanies);
  const companies = useFoundationObjectStore((s) => s.companies);

  const pathName = usePathname();

  useEffect(() => {
    getCompanies();
    getFormOfEmmployments();
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
                          <FormLabel>{t('common:workTitle')}</FormLabel>
                          <Label className="w-fit" inverted>
                            {emp.title}
                          </Label>
                        </div>
                        <div className="flex flex-col">
                          <FormLabel>{t('common:formOfEmployment')}</FormLabel>
                          <Label className="w-fit" inverted>
                            {formOfEmployments.length !== 0
                              ? formOfEmployments.find((x) => x?.foeId === emp?.formOfEmploymentId)?.description
                              : 'Timavlönade'}
                          </Label>
                        </div>
                      </div>
                      <div className="flex flex-col gap-24">
                        <div className="flex flex-col">
                          <FormLabel>{t('common:municipality')}</FormLabel>
                          <p>
                            {companies.length !== 0
                              ? companies.find((x) => x?.companyId === emp?.companyId)?.displayName
                              : 'Saknar information'}
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
                  </Table.Column>
                </Table.Row>
              </Table.Body>
            </Table>
          );
        })
      ) : (
        <p>Inga anställningar att visa</p>
      )}
    </section>
  );
};
