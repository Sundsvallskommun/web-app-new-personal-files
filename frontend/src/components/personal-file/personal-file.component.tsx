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
  const user = useUserStore((s) => s.user);
  const userId = useUserStore((s) => s.userId);
  const getMyEmployments = useUserStore((state) => state.getMyEmployments);
  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const partyId = useEmployeeStore((s) => s.partyId);
  const getEmployeeEmployments = useEmployeeStore((s) => s.getADUserEmployments);
  const userEmployments = useUserStore((s) => s.myEmployments);
  const employments = pathName.includes(PATH.myPersonalFile) ? userEmployments : employeeEmployments;
  const isLoading = pathName.includes(PATH.myPersonalFile)
    ? useUserStore((s) => s.userEmpIsLoading)
    : useEmployeeStore((s) => s.empIsLoading);
  const name = `${employments[0]?.givenname} ${employments[0]?.lastname}`;

  useEffect(() => {
    if (pathName.includes(PATH.myPersonalFile)) {
      userEmployments.length === 0 && getMyEmployments();
    } else {
      employeeEmployments.length === 0 && getEmployeeEmployments(partyId);
    }
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
