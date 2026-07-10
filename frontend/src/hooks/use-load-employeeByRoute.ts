'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { useIsMyPersonalFile } from './use-is-my-personal-file';
import { hasSystemRole } from '@utils/has-system-role';

export const useLoadEmployeeByRoute = () => {
  const router = useRouter();
  const query = useSearchParams();
  const pathName = usePathname();
  const user = useUserStore((s) => s.user);
  const setEmpIsLoading = useEmployeeStore((s) => s.setEmpIsLoading);
  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const userEmployments = useUserStore((s) => s.myEmployments);
  const isMyPersonalFile = useIsMyPersonalFile();
  const employee = isMyPersonalFile ? userEmployments : employeeEmployments;
  const getEmployee = useEmployeeStore((s) => s.getADUserEmployments);
  const setEmploymentslist = useEmployeeStore((s) => s.setEmployments);
  const { CANREADPF } = hasPermission(user);
  const getEndedEmploymentsById = useEmployeeStore((s) => s.getEndedEmploymentsById);
  const { superAdminRole } = hasSystemRole(user);
  const routerPersonId = pathName?.split('/')[2] ? pathName?.split('/')[2] : null;

  useEffect(() => {
    const getPFileByEmployee = () => {
      if (isMyPersonalFile) return;

      if (employee.length) {
        setEmpIsLoading(false);
      }

      const loadPersonalFile = async () => {
        if (!routerPersonId) {
          router.push('/sok-personakt');
          return;
        }

        if (pathName.includes(routerPersonId)) return;

        const shouldFetchEmployee = !employee.length || employee[0].personId !== routerPersonId;

        if (!shouldFetchEmployee) return;

        const res = await getEmployee(routerPersonId as string);

        const employments = res?.data?.[0]?.employments ?? [];

        setEmploymentslist(employments);

        if (superAdminRole) {
          await getEndedEmploymentsById(routerPersonId as string);
        }
      };

      if (router && CANREADPF) {
        loadPersonalFile();
      }
    };

    getPFileByEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, query, CANREADPF]);
};
