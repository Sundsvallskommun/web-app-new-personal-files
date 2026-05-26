'use client';

import { useEmployeeStore } from '@services/employee-service/employee-service';
import { useFoundationObjectStore } from '@services/foundation-object/foundation-object-service';
import { useUserStore } from '@services/user-service/user-service';
import { useEffect } from 'react';
import { useIsMyPersonalFile } from './use-is-my-personal-file';
import { useDocumentStore } from '@services/document-service/document-service';

export const useCurrentEmployeeInfo = () => {
  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const userEmployments = useUserStore((s) => s.myEmployments);
  const isMyPersonalFile = useIsMyPersonalFile();
  const employee = isMyPersonalFile ? userEmployments : employeeEmployments;
  const getFormOfEmmployments = useFoundationObjectStore((s) => s.getFormOfEmployments);
  const getCompanies = useFoundationObjectStore((s) => s.getCompanies);
  const getDocumentTypes = useDocumentStore((s) => s.getDocumentTypes);

  useEffect(() => {
    const getEmpInfo = async () => {
      await Promise.all([getCompanies(), getFormOfEmmployments(), getDocumentTypes()]);
    };
    getEmpInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);
};
