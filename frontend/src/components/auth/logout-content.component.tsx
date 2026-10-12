'use client';

import { useUserStore } from '@services/user-service/user-service';
import { appURL } from '@utils/app-url';
import { authApiURL } from '@utils/auth-api-url';
import { clearPersonDataStorage } from '@utils/clear-person-data-storage';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

export const LogoutContent: React.FC = () => {
  const router = useRouter();

  const resetUser = useUserStore(useShallow((s) => s.reset));

  useEffect(() => {
    resetUser();
    clearPersonDataStorage();

    const query = new URLSearchParams({
      successRedirect: `${appURL()}/login?loggedout`,
    });
    router.push(`${authApiURL('logout')}?${query.toString()}`);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <></>;
};
