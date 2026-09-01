'use client';

import { useUserStore } from '@services/user-service/user-service';
import { Avatar, Logo } from '@sk-web-gui/react';
import { useShallow } from 'zustand/react/shallow';
import NextLink from 'next/link';
import { LogoutButton } from '@components/buttons/logout-button.component';
import { SidebarMenu } from './sidebar-menu.component';
import React from 'react';

export const OverviewSidebar: React.FC = () => {
  const user = useUserStore(useShallow((s) => s.user));
  const workTitle = useUserStore(useShallow((s) => s.workTitle));
  const avatarResponse = useUserStore(useShallow((s) => s.avatarResponse));

  const initials = user.name ? `${user.givenName.charAt(0)}${user.surname.charAt(0)}` : 'AN';
  const userName = user.name ? user.name : 'Användare';

  const SidebarLogo = () => (
    <NextLink
      href="/"
      className="no-underline"
      aria-label={`${process.env.NEXT_PUBLIC_APP_NAME} - Sundsvalls kommun. Gå till startsidan.`}
    >
      <Logo variant={'service'} title={`${process.env.NEXT_PUBLIC_APP_NAME}`} subtitle={'Sundsvalls kommun'} />
    </NextLink>
  );
  return (
    <aside
      data-cy="overview-aside"
      className="p-24 flex flex-col bg-vattjom-background-200 h-screen sm:w-[32rem] sm:min-w-[32rem] justify-between sticky top-0"
    >
      <div className="h-full w-full relative">
        <div className="mb-24">{SidebarLogo()}</div>
        <div className="h-fit items-center">
          <div className="flex gap-10 justify-start items-center">
            <Avatar imageUrl={avatarResponse} initials={initials} />
            <div>
              <p className="leading-tight h-fit font-bold mb-0" data-cy="usertitle">
                {userName}
              </p>
              <span className="leading-tight h-fit mb-0" data-cy="userwork">
                {workTitle}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-8 pt-24">
          <SidebarMenu />
        </div>
      </div>
      <div className="w-full">
        <LogoutButton data-cy="logout-button" />
      </div>
    </aside>
  );
};
