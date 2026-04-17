import { usePathname, useRouter } from 'next/navigation';
import { UserCircle, Search } from 'lucide-react';
import { hasPermission } from '@utils/has-permission';
import { useUserStore } from '@services/user-service/user-service';
import { Button } from '@sk-web-gui/react';
import { ISidebarMenu } from '@interfaces/sidebar/sidebar';
import { useTranslation } from 'react-i18next';
import { PATH } from '@utils/constants';

export const SidebarMenu: React.FC = () => {
  const router = useRouter();
  const currentPath = usePathname();
  const user = useUserStore((s) => s.user);
  const { CANREADPF } = hasPermission(user);
  const { t } = useTranslation();

  const userMenu: ISidebarMenu[] = [
    {
      label: t('common:mypersonal-file'),
      path: `/${PATH.myPersonalFile}`,
      icon: <UserCircle />,
      active: currentPath.includes(PATH.myPersonalFile),
    },
  ];
  const superMenu = [
    {
      label: t('common:personal-files'),
      path: `/${PATH.searchPersonalFile}`,
      icon: <Search />,
      active: currentPath.includes(PATH.searchPersonalFile),
    },
    {
      label: t('common:my-personal-file'),
      path: `/${PATH.myPersonalFile}`,
      icon: <UserCircle />,
      active: currentPath.includes(PATH.myPersonalFile),
    },
  ];

  const useMenu = !CANREADPF ? userMenu : CANREADPF ? superMenu : [];

  return (
    useMenu &&
    useMenu.map((menuItem, idx) => {
      return (
        <Button
          onClick={() => {
            router.push(menuItem.path);
          }}
          className="justify-start"
          active={menuItem.active}
          leftIcon={menuItem.icon}
          key={`menuItem-${idx}`}
          showBackground={menuItem.active}
          color="primary"
          variant={menuItem.active ? 'primary' : 'tertiary'}
        >
          {menuItem.label}
        </Button>
      );
    })
  );
};
