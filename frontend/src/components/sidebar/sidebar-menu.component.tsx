import { usePathname, useRouter } from 'next/navigation';
import { ReactElement } from 'react';
import { UserCircle, Search } from 'lucide-react';
import { hasPermission } from '@utils/has-permission';
import { useUserStore } from '@services/user-service/user-service';
import { Button } from '@sk-web-gui/react';

export interface ISidebarMenu {
  label: string;
  path: string;
  icon?: ReactElement;
  active: boolean;
}

export const SidebarMenu: React.FC = () => {
  const router = useRouter();
  const currentPath = usePathname();
  const user = useUserStore((s) => s.user);
  const { CANREADOWNPF, CANREADPF } = hasPermission(user);
  const userMenu: ISidebarMenu[] = [
    {
      label: 'Min personakt',
      path: '/min-personakt',
      icon: <UserCircle />,
      active: currentPath.includes('min-personakt'),
    },
  ];
  const superMenu = [
    {
      label: 'Personakter',
      path: '/sok-personakt',
      icon: <Search />,
      active: currentPath.includes('sok-personakt'),
    },
    {
      label: 'Min personakt',
      path: '/min-personakt',
      icon: <UserCircle />,
      active: currentPath.includes('min-personakt'),
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
