import { Employee, Employment } from '@interfaces/employee/employee';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { Button, Table } from '@sk-web-gui/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export const SearchPersonalFilesResult: React.FC<{
  employeeEmployments: Employee[];
  employmentslist: Employment[];
}> = ({ employeeEmployments, employmentslist }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const setEmpIsLoading = useEmployeeStore((s) => s.setEmpIsLoading);
  return (
    <Table data-cy="personalfile-result-table" className="max-w-[590px] w-full" background={true}>
      <Table.Header>
        <Table.HeaderColumn>{t('common:name')}</Table.HeaderColumn>
        <Table.HeaderColumn>{t('common:personalNumber')}</Table.HeaderColumn>
        <Table.HeaderColumn>{t('common:workTitle')}</Table.HeaderColumn>
        <Table.HeaderColumn className="hidden">Knapp Öppna personakt</Table.HeaderColumn>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Column data-cy={`pf-name`}>
            <span className="font-bold">
              {employeeEmployments[0].givenname} {employeeEmployments[0].lastname}
            </span>
          </Table.Column>
          <Table.Column data-cy={`pf-personnumber`}>{employeeEmployments[0].personNumber}</Table.Column>
          <Table.Column data-cy={`pf-numberofemployments`}>
            {employmentslist
              .filter((emp) => (employmentslist.length > 1 ? emp.isMainEmployment : emp))
              .map((emp) => {
                return <span key={`employment-${emp.employmentId}`}>{emp.title}</span>;
              })}
          </Table.Column>
          <Table.Column data-cy={`pf-openbutton`}>
            <Button
              variant="tertiary"
              onClick={() => {
                setEmpIsLoading(true);
                router.push(`sok-personakt/${employeeEmployments[0].personId}`);
              }}
            >
              {t('common:openPersonalFile')}
            </Button>
          </Table.Column>
        </Table.Row>
      </Table.Body>
    </Table>
  );
};
