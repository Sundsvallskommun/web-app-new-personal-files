'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RootIndex() {
  const user = useUserStore((s) => s.user);
  const { CANREADPF, CANREADOWNPF } = hasPermission(user);

  useEffect(() => {
    if (!CANREADPF) {
      if (CANREADOWNPF) {
        redirect('/min-personakt');
      } else {
        redirect('/login');
      }
    } else {
      redirect('/sok-personakt');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CANREADPF]);

  return <LoaderFullScreen />;
}
