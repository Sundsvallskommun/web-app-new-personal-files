import { Employee } from '@interfaces/employee/employee';
import { Divider, Table } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';

export const PersonalFileEmployments: React.FC<{ employments: Employee[] }> = ({ employments }) => {
  const { t } = useTranslation();
  return (
    <section>
      <Divider.Section>{t('common:ongoingEmployments')}</Divider.Section>
      {employments.map((emp, idx) => {
        return (
          <Table background>
            <Table.Header>
              <Table.HeaderColumn></Table.HeaderColumn>
            </Table.Header>
          </Table>
        );
      })}
    </section>
  );
};
