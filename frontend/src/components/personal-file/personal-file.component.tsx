'use client';

import { usePathname } from 'next/navigation';
import { PersonalFileEmployments } from './personal-file-employemnts/personal-file-employments.component';
import { PATH } from '@utils/constants';
import { useUserStore } from '@services/user-service/user-service';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { Spinner } from '@sk-web-gui/react';
import { MetaData } from '@interfaces/document/document';
import { useDocumentStore } from '@services/document-service/document-service';
import { useFoundationObjectStore } from '@services/foundation-object/foundation-object-service';
import { useEffect } from 'react';

export const PersonalFile: React.FC = () => {
  const pathName = usePathname();
  const getDocumentList = useDocumentStore((s) => s.getDocumentList);
  const getFormOfEmmployments = useFoundationObjectStore((s) => s.getFormOfEmployments);
  const getCompanies = useFoundationObjectStore((s) => s.getCompanies);
  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const partyId = useEmployeeStore((s) => s.partyId);
  const getEmployeeEmployments = useEmployeeStore((s) => s.getADUserEmployments);
  const userEmployments = useUserStore((s) => s.myEmployments);
  const employments = pathName.includes(PATH.myPersonalFile) ? userEmployments : employeeEmployments;
  const userEmpIsLoading = useUserStore((s) => s.userEmpIsLoading);
  const empIsLoading = useEmployeeStore((s) => s.empIsLoading);
  const isLoading = pathName.includes(PATH.myPersonalFile) ? userEmpIsLoading : empIsLoading;
  const name = `${employments[0]?.givenname} ${employments[0]?.lastname}`;

  const getEmpInfo = async () => {
    if (!pathName.includes(PATH.myPersonalFile)) {
      if (employments.length === 0) await getEmployeeEmployments(partyId);
    }
    await Promise.all([getCompanies(), getFormOfEmmployments()]);
  };

  const getDocuments = async (): Promise<void> => {
    const personId = employments[0]?.personId;

    if (!personId) {
      return;
    }

    const metadata: MetaData[] = [
      {
        key: 'partyId',
        matchesAny: [personId],
      },
    ];

    await getDocumentList(metadata);
  };

  useEffect(() => {
    getEmpInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employments]);

  useEffect(() => {
    getDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employments]);

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
