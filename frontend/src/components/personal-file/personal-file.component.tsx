'use client';

import { PersonalFileEmployments } from './personal-file-employemnts/personal-file-employments.component';
import { useUserStore } from '@services/user-service/user-service';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { Spinner } from '@sk-web-gui/react';
import { useCurrentEmployeeInfo } from '@hooks/use-current-employee-info';
import { useLoadEmployeeByRoute } from '@hooks/use-load-employeeByRoute';
import { useIsMyPersonalFile } from '@hooks/use-is-my-personal-file';

export const PersonalFile: React.FC = () => {
  const isMyPersonalFile = useIsMyPersonalFile();

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
          <h1 className="w-fit">{name}</h1>
          <PersonalFileEmployments employee={employee} />
        </>
      )}
    </div>
  );
};
