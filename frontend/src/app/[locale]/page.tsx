'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { hasSystemRole } from '@utils/has-system-role';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RootIndex() {
  const user = useUserStore((s) => s.user);
  const userFetched = useUserStore((s) => s.userFetched);
  const { CANREADPF, CANREADOWNPF } = hasPermission(user);
  const { adminRole } = hasSystemRole(user);

  useEffect(() => {
    if (!userFetched) return;

    if (CANREADPF) {
      if (adminRole) {
        redirect('/mina-medarbetare');
      } else {
        redirect('/sok-personakt');
      }
    } else if (CANREADOWNPF) {
      redirect('/min-personakt');
    } else {
      redirect('/login');
    }
  }, [userFetched, CANREADPF, CANREADOWNPF, adminRole]);

  return <LoaderFullScreen />;
}
