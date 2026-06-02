import { usePathname, useRouter } from 'next/navigation';
import { UserCircle, Search, Users } from 'lucide-react';
import { hasPermission } from '@utils/has-permission';
import { useUserStore } from '@services/user-service/user-service';
import { Button } from '@sk-web-gui/react';
import { ISidebarMenu } from '@interfaces/sidebar/sidebar';
import { useTranslation } from 'react-i18next';
import { PATH } from '@utils/constants';
import { hasSystemRole } from '@utils/has-system-role';

export const SidebarMenu: React.FC = () => {
  const router = useRouter();
  const currentPath = usePathname();
  const user = useUserStore((s) => s.user);
  const { CANREADPF } = hasPermission(user);
  const { adminRole } = hasSystemRole(user);
  const { t } = useTranslation();

  const items = {
    myPersonalFile: {
      label: t('common:myPersonalFile'),
      path: `/${PATH.myPersonalFile}`,
      icon: <UserCircle />,
    },
    myEmployees: {
      label: t('common:myEmployees'),
      path: `/${PATH.myEmployees}`,
      icon: <Users />,
    },
    searchPersonalFile: {
      label: t('common:personalFiles'),
      path: `/${PATH.searchPersonalFile}`,
      icon: <Search />,
    },
  };

  const getMenuItems = () => {
    if (!CANREADPF) return [{ ...items.myPersonalFile, label: t('common:myPersonalFile') }];
    if (adminRole) return [items.myEmployees, items.myPersonalFile];
    return [items.searchPersonalFile, items.myPersonalFile];
  };

  const menu: ISidebarMenu[] = getMenuItems().map((item) => ({
    ...item,
    active: currentPath.includes(item.path.slice(1)),
  }));

  return menu.map((menuItem) => {
    const isActive = menuItem.active;
    return (
      <Button
        key={menuItem.path}
        onClick={() => router.push(menuItem.path)}
        className="justify-start"
        active={isActive}
        leftIcon={menuItem.icon}
        showBackground={isActive}
        color="primary"
        variant={isActive ? 'primary' : 'tertiary'}
      >
        {menuItem.label}
      </Button>
    );
  });
};
