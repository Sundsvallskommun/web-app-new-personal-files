'use client';

import { usePathname } from 'next/navigation';
import { PersonalFileEmployments } from './personal-file-employemnts/personal-file-employments.component';
import { PATH } from '@utils/constants';
import { useUserStore } from '@services/user-service/user-service';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { useEffect } from 'react';
import { Spinner } from '@sk-web-gui/react';

export const PersonalFile: React.FC = () => {
  const pathName = usePathname();
  const getMyEmployments = useUserStore((state) => state.getMyEmployments);
  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const partyId = useEmployeeStore((s) => s.partyId);
  const getEmployeeEmployments = useEmployeeStore((s) => s.getADUserEmployments);
  const userEmployments = useUserStore((s) => s.myEmployments);
  const employments = pathName.includes(PATH.myPersonalFile) ? userEmployments : employeeEmployments;
  const userEmpIsLoading = useUserStore((s) => s.userEmpIsLoading);
  const empIsLoading = useEmployeeStore((s) => s.empIsLoading);
  const isLoading = pathName.includes(PATH.myPersonalFile) ? userEmpIsLoading : empIsLoading;
  const name = `${employments[0]?.givenname} ${employments[0]?.lastname}`;

  useEffect(() => {
    if (pathName.includes(PATH.myPersonalFile)) {
      if (userEmployments.length === 0) getMyEmployments();
    } else {
      if (employeeEmployments.length === 0) getEmployeeEmployments(partyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmployments]);

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center mt-100">
          <Spinner size={12} aria-label="Laddar information" />
        </div>
      ) : (
        <>
          <h1 className="w-fit">{name}</h1>

          <PersonalFileEmployments employments={employments} />
        </>
      )}
    </div>
  );
};
