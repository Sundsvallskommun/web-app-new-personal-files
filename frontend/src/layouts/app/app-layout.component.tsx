'use client';

import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { getAvatarResponse, useUserStore } from '@services/user-service/user-service';
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
  const setAvatarRes = useUserStore((state) => state.setAvatarResponse);
  const [mounted, setMounted] = useState(false);
  const user = useUserStore((s) => s.user);
  const userFetched = useUserStore((s) => s.userFetched);
  const isUserLoaded = !!user?.username;
  const { CANREADOWNPF } = hasPermission(user);

  useEffect(() => {
    getMe();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, [getMe, setMounted]);

  useEffect(() => {
    if (isUserLoaded) {
      getMyEmployments();
      getAvatarResponse().then((res) => {
        setAvatarRes(res);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUserLoaded]);

  useEffect(() => {
    if (!userFetched) return;
    if (!CANREADOWNPF && pathName.includes('personakt')) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userFetched, CANREADOWNPF, pathName]);

  if (!userFetched && !mounted) return <LoaderFullScreen />;

  return (
    <GuiProvider colorScheme={colorScheme}>
      <ConfirmationDialogContextProvider>{children}</ConfirmationDialogContextProvider>
    </GuiProvider>
  );
};

export default AppLayout;
