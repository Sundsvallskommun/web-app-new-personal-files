'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RootIndex() {
  const user = useUserStore((s) => s.user);
  const isUserLoaded = !!user?.username;
  const { CANREADPF, CANREADOWNPF } = hasPermission(user);

  useEffect(() => {
    if (!isUserLoaded) return;

    if (CANREADPF) {
      redirect('/sok-personakt');
    } else if (CANREADOWNPF) {
      redirect('/min-personakt');
    } else {
      redirect('/login');
    }
  }, [isUserLoaded, CANREADPF, CANREADOWNPF]);

  return <LoaderFullScreen />;
}
