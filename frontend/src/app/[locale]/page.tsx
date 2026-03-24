'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RootIndex() {
  const user = useUserStore((s) => s.user);
  const { CANREADPF } = hasPermission(user);

  useEffect(() => {
    if (CANREADPF) {
      redirect('/sok-personakt');
    } else {
      redirect('/login');
    }
  }, [CANREADPF]);

  return <LoaderFullScreen />;

}