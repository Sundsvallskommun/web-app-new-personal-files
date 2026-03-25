'use client';

import { useUserStore } from '@services/user-service/user-service';
import { Avatar, cx, Logo } from '@sk-web-gui/react';
import { useShallow } from 'zustand/react/shallow';
import NextLink from 'next/link';
import { LogoutButton } from '@components/buttons/logout-button.component';
import { SidebarMenu } from './sidebar-menu.component';

export const OverviewSidebar: React.FC = () => {

  const user = useUserStore(useShallow((s) => s.user));
  const avatar = useUserStore(useShallow((s) => s.avatar));

  const initials = user.name? `${user.givenName.charAt(0)}${user.surname.charAt(0)}` : 'AN';
  const userName = user.name? user.name : "Användare";
  const workTitle = "Arbetstitel"; //edit when roles and auth are fixed

  const SidebarLogo = () => (
    <NextLink
      href="/"
      className="no-underline"
      aria-label={`${process.env.NEXT_PUBLIC_APP_NAME} - Sundsvalls kommun. Gå till startsidan.`}
    >
      <Logo
        variant={'service'}
        title={`${process.env.NEXT_PUBLIC_APP_NAME}`}
        subtitle={'Sundsvalls kommun'}
      />
    </NextLink>
  );
  return (
    <>
      <aside
        data-cy="overview-aside"
        className={cx(
          'sticky transition-all ease-in-out duration-150 p-24 flex flex-col bg-vattjom-background-200 min-h-screen max-lg:shadow-100 sm:w-[32rem] sm:min-w-[32rem]'
        )}
      >
        <div className={cx('h-full w-full relative')}>
          <div className={cx('mb-24')}>
            <SidebarLogo />
          </div>
          <div
            className={cx(
              'h-fit items-center'
            )}
          >
              <div className="flex gap-10 justify-start items-center">
                    <Avatar imageUrl={avatar} initials={initials} />
                <div>
                    <p className="leading-tight h-fit font-bold mb-0" data-cy="userinfo">
                    {userName}
                    </p>
                    <span className="leading-tight h-fit mb-0" data-cy="userinfo">
                    {workTitle}
                    </span>
                </div>
              </div>
          </div>
          <div className="flex flex-col gap-8 pt-24">
            <SidebarMenu />
          </div>
          <div className="absolute bottom-[2.4rem] w-full">
            <LogoutButton  data-cy="logout-button" />
          </div>
        </div>
      </aside>
    </>
  );
};
