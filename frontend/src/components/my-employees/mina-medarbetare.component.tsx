'use client';

import { useLoadManagerEmployees } from '@hooks/use-load-manager-employees';
import { ManagerEmployeesQuery } from '@interfaces/employee/employee';
import { useUserStore } from '@services/user-service/user-service';
import { FormLabel, SearchField, Spinner } from '@sk-web-gui/react';
import { useWatch, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const MinaMedarbetare: React.FC = () => {
  const { t } = useTranslation();

  const managerEmployees = useUserStore((s) => s.managerEmployees);
  const managerEmployeesIsLoading = useUserStore((s) => s.managerEmpIsLoading);

  const { control, setValue } = useForm<ManagerEmployeesQuery>({
    defaultValues: {
      PageNumber: 1,
      PageSize: 25,
      OrderDirection: 'ASC',
      OrderBy: 'FullName',
    },
  });

  const formValues = useWatch({ control });
  const search = useWatch({ control, name: 'search' });

  useLoadManagerEmployees(formValues);

  console.log(managerEmployees);

  return (
    <>
      <h1 className="hidden">{t('common:myEmployees')}</h1>

      <section>
        <div className="w-full pt-16 pb-24 rounded-button">
          <FormLabel>
            <span className="font-bold">{t('common:searchEmployee')}</span>
          </FormLabel>

          <SearchField
            value={search ?? ''}
            onChange={(e) => {
              setValue('search', e.target.value, {
                shouldDirty: true,
                shouldTouch: true,
              });
            }}
          />

          <div>
            {managerEmployeesIsLoading ? (
              <Spinner size={4} />
            ) : (
              managerEmployees.map((emp, idx) => {
                return <div key={`emp${emp.personId}`}>{emp.fullName}</div>;
              })
            )}
          </div>
        </div>
      </section>
    </>
  );
};
