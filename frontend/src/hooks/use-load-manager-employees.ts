'use client';

import { ManagerEmployeesQuery } from '@interfaces/employee/employee';
import { useUserStore } from '@services/user-service/user-service';
import { useEffect } from 'react';

export const useLoadManagerEmployees = (query: ManagerEmployeesQuery) => {
  const getManagerEmployees = useUserStore((s) => s.getManagerEmployees);
  const userId = useUserStore((s) => s.userId);

  const queryKey = JSON.stringify(query);

  useEffect(() => {
    const loadEmployees = async () => {
      if (userId && query) await getManagerEmployees(query);
    };

    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, userId]);
};
