'use client';

import { useUserStore } from '@services/user-service/user-service';
import { toNormalizedEmployment, useEmployeeStore } from '@services/employee-service/employee-service';
import { Button, Spinner } from '@sk-web-gui/react';
import { useCurrentEmployeeInfo } from '@hooks/use-current-employee-info';
import { useLoadEmployeeByRoute } from '@hooks/use-load-employeeByRoute';
import { useIsMyPersonalFile } from '@hooks/use-is-my-personal-file';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import { hasSystemRole } from '@utils/has-system-role';
import { PATH } from '@utils/constants';
import { Employments } from '@components/personal-file/employments/employments.component';
import { EndedEmployments } from '@components/personal-file/employments/ended-employments/ended-employments.component';
import { useLoadDocuments } from '@hooks/use-load-documents';
import { hasPermission } from '@utils/has-permission';
import { NormalizedEmployment } from '@interfaces/employee/employee';

export const PersonalFile: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathName = usePathname();
  const isMyPersonalFile = useIsMyPersonalFile();

  const user = useUserStore((s) => s.user);
  const { adminRole } = hasSystemRole(user);

  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const employeeEndedEmployments = useEmployeeStore((s) => s.employeeEndedEmployments);
  const userEmployments = useUserStore((s) => s.myEmployments);
  const myEndedEmployments = useUserStore((s) => s.myEndedEmployments);
  const userEmpIsLoading = useUserStore((s) => s.userEmpIsLoading);
  const empIsLoading = useEmployeeStore((s) => s.empIsLoading);
  const employee = isMyPersonalFile ? userEmployments : employeeEmployments;
  const endedEmployments = isMyPersonalFile ? myEndedEmployments : employeeEndedEmployments;
  const isLoading = isMyPersonalFile ? userEmpIsLoading : empIsLoading;
  const firstEmployee = employee?.[0];
  const name = firstEmployee ? `${firstEmployee.givenname} ${firstEmployee.lastname}` : '';
  const { CANREADOWNDOCS } = hasPermission(user);

  useCurrentEmployeeInfo();
  useLoadEmployeeByRoute();

  const allEmployments: NormalizedEmployment[] = [
    ...(firstEmployee?.employments ?? []),
    ...endedEmployments.map(toNormalizedEmployment),
  ];
  useLoadDocuments(CANREADOWNDOCS ? firstEmployee?.personId : undefined, allEmployments);

  if (isLoading) {
    return <Spinner className="mx-auto my-40" size={12} aria-label="Laddar information" />;
  }

  if (!firstEmployee) {
    return (
      <div className="pt-24">
        <p className="text-h3-lg pb-16">{t('common:userHasNoPersonalFile.title')}</p>
        <p>{t('common:userHasNoPersonalFile.description')}</p>
      </div>
    );
  }

  return (
    <div>
      {adminRole && pathName.includes(PATH.myEmployees) && (
        <Button
          className="mb-20"
          leftIcon={<ArrowLeft size={20} />}
          variant="link"
          onClick={() => router.push('/mina-medarbetare')}
          data-cy="managed-employments-back-link"
        >
          {t('common:myEmployees')}
        </Button>
      )}

      <h1 className="w-fit">{name}</h1>
      <Employments employee={employee} allEmployments={allEmployments} />
      {endedEmployments?.length > 0 && (
        <EndedEmployments
          endedEmployments={endedEmployments}
          personId={firstEmployee.personId}
          allEmployments={allEmployments}
        />
      )}
    </div>
  );
};
