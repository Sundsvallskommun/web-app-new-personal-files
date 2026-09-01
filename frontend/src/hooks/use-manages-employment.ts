'use client';

import { useLoadManagerEmployees } from '@hooks/use-load-manager-employees';
import { useUserStore } from '@services/user-service/user-service';
import { hasSystemRole } from '@utils/has-system-role';
import { useMemo } from 'react';

export const useManagesEmployment = (personId?: string) => {
  const user = useUserStore((s) => s.user);
  const managerEmployees = useUserStore((s) => s.managerEmployees);
  const { superAdminRole } = hasSystemRole(user);

  useLoadManagerEmployees({ PageNumber: 1, PageSize: 1000 });

  const managedEmploymentIds = useMemo(() => {
    const myEmployees = managerEmployees.data ?? [];
    const thisEmployee = myEmployees.find((e) => e.personId === personId);
    const managedEmployments = thisEmployee?.employments ?? [];
    return new Set(managedEmployments.map((e) => e.employmentId));
  }, [managerEmployees.data, personId]);

  return (employmentId?: number) => {
    if (superAdminRole) {
      return true;
    }

    if (employmentId === undefined) {
      return false;
    }

    return managedEmploymentIds.has(employmentId);
  };
};
