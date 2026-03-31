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
      if(CANREADOWNPF) {
        redirect('/min-personakt');
      } else {
        redirect('/login');
      }
      
    } else {
      redirect('/sok-personakt');
    }
  }, [CANREADPF]);

  return <LoaderFullScreen />;

}