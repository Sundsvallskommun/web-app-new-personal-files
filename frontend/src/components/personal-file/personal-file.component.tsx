'use client';

import { PersonalFileEmployments } from './personal-file-employemnts/personal-file-employments.component';
import { useUserStore } from '@services/user-service/user-service';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { Button, Spinner } from '@sk-web-gui/react';
import { useCurrentEmployeeInfo } from '@hooks/use-current-employee-info';
import { useLoadEmployeeByRoute } from '@hooks/use-load-employeeByRoute';
import { useIsMyPersonalFile } from '@hooks/use-is-my-personal-file';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import { hasSystemRole } from '@utils/has-system-role';
import { PATH } from '@utils/constants';

export const PersonalFile: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathName = usePathname();
  const isMyPersonalFile = useIsMyPersonalFile();

  const user = useUserStore((s) => s.user);
  const { adminRole } = hasSystemRole(user);

  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const userEmployments = useUserStore((s) => s.myEmployments);

  const userEmpIsLoading = useUserStore((s) => s.userEmpIsLoading);
  const empIsLoading = useEmployeeStore((s) => s.empIsLoading);

  const employee = isMyPersonalFile ? userEmployments : employeeEmployments;
  const isLoading = isMyPersonalFile ? userEmpIsLoading : empIsLoading;

  const firstEmployee = employee?.[0];

  const name = firstEmployee ? `${firstEmployee.givenname} ${firstEmployee.lastname}` : '';

  useCurrentEmployeeInfo();
  useLoadEmployeeByRoute();

  return (
    <div>
      {isLoading || !firstEmployee ? (
        <div className="flex justify-center mt-100">
          <Spinner size={12} aria-label="Laddar information" />
        </div>
      ) : (
        <>
          {adminRole && pathName.includes(PATH.myEmployees) && (
            <Button
              className="mb-20"
              leftIcon={<ArrowLeft size={20} />}
              variant="link"
              onClick={() => router.push('/mina-medarbetare')}
            >
              {t('common:myEmployees')}
            </Button>
          )}

          <h1 className="w-fit">{name}</h1>
          <PersonalFileEmployments employee={employee} />
        </>
      )}
    </div>
  );
};
