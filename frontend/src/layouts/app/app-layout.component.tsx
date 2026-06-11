'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { getAvatarResponse, managerQueries, useUserStore } from '@services/user-service/user-service';
import { GuiProvider, ConfirmationDialogContextProvider } from '@sk-web-gui/react';
import { hasPermission } from '@utils/has-permission';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import dayjs from 'dayjs';
import 'dayjs/locale/sv';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';
import { hasSystemRole } from '@utils/has-system-role';
import { PATH } from '@utils/constants';

dayjs.extend(utc);
dayjs.locale('sv');
dayjs.extend(updateLocale);
dayjs.updateLocale('sv', {
  months: [
    'Januari',
    'Februari',
    'Mars',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'Augusti',
    'September',
    'Oktober',
    'November',
    'December',
  ],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
});

interface ClientApplicationProps {
  children: ReactNode;
}

const AppLayout = ({ children }: ClientApplicationProps) => {
  const router = useRouter();
  const pathName = usePathname();
  const colorScheme = useLocalStorage(useShallow((state) => state.colorScheme));
  const getMe = useUserStore((state) => state.getMe);
  const getMyEmployments = useUserStore((state) => state.getMyEmployments);
  const getManagerEmployees = useUserStore((state) => state.getManagerEmployees);
  const setAvatarRes = useUserStore((state) => state.setAvatarResponse);
  const [mounted, setMounted] = useState(false);
  const user = useUserStore((s) => s.user);
  const userFetched = useUserStore((s) => s.userFetched);
  const userId = useUserStore((s) => s.userId);
  const isUserLoaded = !!user?.username;
  const { CANREADOWNPF, CANREADPF } = hasPermission(user);
  const { adminRole } = hasSystemRole(user);

  useEffect(() => {
    getMe();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, [getMe, setMounted]);

  useEffect(() => {
    if (!userFetched || !isUserLoaded) return;
    getMyEmployments();
    if (userId) {
      getAvatarResponse()
        .then((res) => {
          setAvatarRes(res);
        })
        .catch(() => {
          // Avatar is non-critical (and rate-limited); don't let a failed fetch become an unhandled rejection.
        });
    }
    // Only pre-load the list on the list page itself — `endsWith` (not `includes`) so personal-file
    // sub-routes (/mina-medarbetare/:personId) don't needlessly re-fetch the manager-employees list.
    if (adminRole && pathName.endsWith(PATH.myEmployees)) {
      getManagerEmployees(managerQueries);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFetched, isUserLoaded, userId]);

  useEffect(() => {
    if (!userFetched) return;

    const isMyEmployeesPage = pathName.includes(PATH.myEmployees);
    const isSearchPersonalFilesPage = pathName.includes(PATH.searchPersonalFile);

    if (userFetched && isMyEmployeesPage && !adminRole) {
      router.replace(CANREADPF ? '/sok-personakt' : '/min-personakt');
      return;
    }

    if (userFetched && isSearchPersonalFilesPage && adminRole) {
      router.replace('/mina-medarbetare');
      return;
    }

    if (!CANREADOWNPF && (pathName.includes('personakt') || pathName.includes('mina'))) {
      router.replace('/login');
    }
  }, [userFetched, adminRole, CANREADOWNPF, CANREADPF, pathName, router]);

  if (!userFetched && !mounted) return <LoaderFullScreen />;

  return (
    <GuiProvider colorScheme={colorScheme}>
      <ConfirmationDialogContextProvider>{children}</ConfirmationDialogContextProvider>
    </GuiProvider>
  );
};

export default AppLayout;
