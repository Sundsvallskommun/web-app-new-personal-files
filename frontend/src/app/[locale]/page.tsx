'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { hasSystemRole } from '@utils/has-system-role';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootIndex() {
  const user = useUserStore((s) => s.user);
  const userFetched = useUserStore((s) => s.userFetched);
  const { CANREADPF, CANREADOWNPF } = hasPermission(user);
  const { adminRole } = hasSystemRole(user);
  const router = useRouter();

  useEffect(() => {
    if (!userFetched) return;

    if (CANREADPF) {
      router.replace(adminRole ? '/mina-medarbetare' : '/sok-personakt');
    } else if (CANREADOWNPF) {
      router.replace('/min-personakt');
    } else {
      router.replace('/login');
    }
  }, [userFetched, CANREADPF, CANREADOWNPF, adminRole, router]);

  return <LoaderFullScreen />;
}
