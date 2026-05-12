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

    const { CANREADPF, CANREADOWNPF } = hasPermission(user);
    const { adminRole } = hasSystemRole(user);

    const destination = CANREADPF
      ? adminRole
        ? '/mina-medarbetare'
        : '/sok-personakt'
      : CANREADOWNPF
        ? '/min-personakt'
        : '/login';

    router.replace(destination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFetched, CANREADPF, CANREADOWNPF, adminRole, router]);

  return <LoaderFullScreen />;
}
