'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RootIndex() {
  const user = useUserStore((s) => s.user);
  const userFetched = useUserStore((s) => s.userFetched);
  const { CANREADPF, CANREADOWNPF } = hasPermission(user);

  useEffect(() => {
    if (!userFetched) return;

    if (CANREADPF) {
      if (user.systemRole === 'pf_hr_admin') {
        redirect('/mina-medarbetare');
      } else {
        redirect('/sok-personakt');
      }
    } else if (CANREADOWNPF) {
      redirect('/min-personakt');
    } else {
      redirect('/login');
    }
  }, [userFetched, CANREADPF, CANREADOWNPF]);

  return <LoaderFullScreen />;
}
