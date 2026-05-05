'use client';

import { useLoadManagerEmployees } from '@hooks/use-load-manager-employees';
import { ManagerEmployeesQuery } from '@interfaces/employee/employee';
import { managerQueries, useUserStore } from '@services/user-service/user-service';
import { FormLabel, SearchField, Spinner } from '@sk-web-gui/react';
import { useWatch, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ManagerEmployeesTable } from './mina-medarbetare-table.component';
import { useEffect } from 'react';
import { useEmployeeStore } from '@services/employee-service/employee-service';

export const MinaMedarbetare: React.FC = () => {
  const { t } = useTranslation();

  const managerEmployees = useUserStore((s) => s.managerEmployees);
  const managerEmployeesIsLoading = useUserStore((s) => s.managerEmpIsLoading);
  const setEmployeeEmployments = useEmployeeStore((state) => state.setEmployeeEmployments);
  const setEmploymentsList = useEmployeeStore((state) => state.setEmployments);

  const { control, setValue, reset } = useForm<ManagerEmployeesQuery>({
    defaultValues: {
      ...managerQueries,
    },
  });

  const formValues = useWatch({ control });
  const search = useWatch({ control, name: 'search' });
  const handleResetSearch = () => {
    reset({ ...formValues, search: undefined });
  };

  useEffect(() => {
    setEmployeeEmployments([]);
    setEmploymentsList([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLoadManagerEmployees(formValues);

  return (
    <>
      <h1 className="hidden">{t('common:myEmployees')}</h1>

      <section>
        <div className="w-full pt-16 pb-24 rounded-button">
          <FormLabel>
            <span className="font-bold">{t('common:searchEmployee')}</span>
          </FormLabel>

          <SearchField
            className="mt-8"
            value={search ?? ''}
            onChange={(e) => {
              setValue('PageNumber', 1, {
                shouldDirty: true,
                shouldTouch: true,
              });
              setValue('search', e.target.value, {
                shouldDirty: true,
                shouldTouch: true,
              });
            }}
            onReset={handleResetSearch}
          />

          <div className="mt-16">
            {managerEmployeesIsLoading ? (
              <div className="w-full flex justify-center py-24">
                {' '}
                <Spinner size={4} />
              </div>
            ) : managerEmployees.pageSize !== 0 ? (
              <ManagerEmployeesTable formValues={formValues} managerEmployees={managerEmployees} setValue={setValue} />
            ) : (
              <span>{t('common:noEmployeesToShow')}</span>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
