'use client';

import { ManagerEmployeesQuery } from '@interfaces/employee/employee';
import { useUserStore } from '@services/user-service/user-service';
import { useEffect } from 'react';

export const useLoadManagerEmployees = (query: ManagerEmployeesQuery) => {
  const getManagerEmployees = useUserStore((s) => s.getManagerEmployees);
  const userId = useUserStore((s) => s.userId);

  // `query` comes from react-hook-form's useWatch, which returns a NEW object reference on every render.
  // Keying the effect on the reference re-fired it every render (and getManagerEmployees toggles a loading
  // flag → re-render → refetch → loop), hammering the throttled gateway. Depend on the value instead.
  const queryKey = JSON.stringify(query);
  useEffect(() => {
    const loadEmployees = async () => {
      if (userId && query) await getManagerEmployees(query);
    };

    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, userId]);
};
