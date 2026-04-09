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
  const getWorkTitle = useUserStore((state) => state.getWorkTitle);
  const setAvatarRes = useUserStore((state) => state.setAvatarResponse);
  const [mounted, setMounted] = useState(false);
  const user = useUserStore((s) => s.user);
  const { CANREADOWNPF } = hasPermission(user);

  useEffect(() => {
    getMe();
    setMounted(true);
  }, [getMe, setMounted]);

  useEffect(() => {
    if (user && user.username) {
      getWorkTitle();
      getAvatarResponse().then((res) => {
        setAvatarRes(res);
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (!CANREADOWNPF && pathName.includes('personakt')) {
        router.push('/login');
      } else {
        router.push(pathName);
      }
    }
  }, [user, CANREADOWNPF, pathName]);

  if (!user) return <LoaderFullScreen />;

  return (
    <GuiProvider colorScheme={colorScheme}>
      <ConfirmationDialogContextProvider>{children}</ConfirmationDialogContextProvider>
    </GuiProvider>
  );
};

export default AppLayout;
