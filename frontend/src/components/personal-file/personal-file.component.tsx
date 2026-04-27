'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PersonalFileEmployments } from './personal-file-employemnts/personal-file-employments.component';
import { PATH } from '@utils/constants';
import { useUserStore } from '@services/user-service/user-service';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { Spinner } from '@sk-web-gui/react';
import { MetaData } from '@interfaces/document/document';
import { useDocumentStore } from '@services/document-service/document-service';
import { useFoundationObjectStore } from '@services/foundation-object/foundation-object-service';
import { useEffect } from 'react';
import { hasPermission } from '@utils/has-permission';

export const PersonalFile: React.FC = () => {
  const router = useRouter();
  const query = useSearchParams();
  const pathName = usePathname();
  const user = useUserStore((s) => s.user);
  const getDocumentList = useDocumentStore((s) => s.getDocumentList);
  const getFormOfEmmployments = useFoundationObjectStore((s) => s.getFormOfEmployments);
  const getCompanies = useFoundationObjectStore((s) => s.getCompanies);
  const getEmployee = useEmployeeStore((s) => s.getADUserEmployments);
  const setEmploymentslist = useEmployeeStore((s) => s.setEmployments);
  const setEmpIsLoading = useEmployeeStore((s) => s.setEmpIsLoading);
  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const userEmployments = useUserStore((s) => s.myEmployments);
  const employee = pathName.includes(PATH.myPersonalFile) ? userEmployments : employeeEmployments;
  const userEmpIsLoading = useUserStore((s) => s.userEmpIsLoading);
  const empIsLoading = useEmployeeStore((s) => s.empIsLoading);
  const isLoading = pathName.includes(PATH.myPersonalFile) ? userEmpIsLoading : empIsLoading;
  const name = `${employee[0]?.givenname} ${employee[0]?.lastname}`;
  const routerPersonId = pathName?.split('/')[2] ? pathName?.split('/')[2] : null;

  const { CANREADPF } = hasPermission(user);

  const getEmpInfo = async () => {
    await Promise.all([getCompanies(), getFormOfEmmployments()]);
  };

  const getDocuments = async (): Promise<void> => {
    const personId = employee[0]?.personId;

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

  const getPFileByEmployee = () => {
    if (pathName.includes(PATH.myPersonalFile)) return;

    if (employee.length) setEmpIsLoading(false);

    const loadPersonalFile = async () => {
      if (routerPersonId) {
        if (pathName.includes(routerPersonId)) return;

        if (!employee.length || employee[0].personId !== routerPersonId) {
          const res = await getEmployee(routerPersonId as string);

          if (res?.data) {
            setEmploymentslist(res.data[0].employments || []);
          }
        }
      } else if (!routerPersonId) {
        router.push('/sok-personakt');
      } else {
        router.push(pathName);
      }
    };

    if (router && CANREADPF) {
      loadPersonalFile();
    }
  };

  useEffect(() => {
    getEmpInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  useEffect(() => {
    getPFileByEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, query, CANREADPF]);

  useEffect(() => {
    getDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);

  return (
    <div>
      {isLoading ? (
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
