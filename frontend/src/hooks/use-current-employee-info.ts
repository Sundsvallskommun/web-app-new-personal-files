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
  const companies = useFoundationObjectStore((s) => s.companies);
  const formOfEmployments = useFoundationObjectStore((s) => s.formOfEmployments);
  const documentTypes = useDocumentStore((s) => s.documentTypes);

  useEffect(() => {
    // These are static lookup lists — only fetch the ones not already loaded to avoid hammering the gateway.
    const getEmpInfo = async () => {
      await Promise.all([
        companies.length ? Promise.resolve() : getCompanies(),
        formOfEmployments.length ? Promise.resolve() : getFormOfEmmployments(),
        documentTypes.length ? Promise.resolve() : getDocumentTypes(),
      ]);
    };
    getEmpInfo();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee]);
};
