'use client';

import { OverviewSidebar } from '@components/sidebar/overview-sidebar.component';
import { CookieConsent, Link } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';

interface DefaultLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  preContent?: React.ReactNode;
  postContent?: React.ReactNode;
  logoLinkHref?: string;
}

export default function DefaultLayout({ children }: DefaultLayoutProps) {
  const { t } = useTranslation();

  const setFocusToMain = () => {
    const contentElement = document.getElementById('content');
    contentElement?.focus();
  };

  return (
    <div className="DefaultLayout full-page-layout">
      <Link
        as={NextLink}
        href="#content"
        onClick={setFocusToMain}
        accessKey="s"
        className="next-link-a"
        data-cy="systemMessage-a"
      >
        {t('layout:header.goto_content')}
      </Link>

      <div className="flex">
        <OverviewSidebar />
        <div className="w-full flex justify-center px-48 pt-40">
          <div className="max-w-[1024px] w-full">{children}</div>
        </div>
      </div>

      <CookieConsent
        title={t('layout:cookies.title', { app: process.env.NEXT_PUBLIC_APP_NAME })}
        body={
          <p>
            {t('layout:cookies.description')}{' '}
            <NextLink href="/kakor" passHref legacyBehavior>
              <Link>{t('layout:cookies.read_more')}</Link>
            </NextLink>
          </p>
        }
        cookies={[
          {
            optional: false,
            displayName: t('layout:cookies.necessary.displayName'),
            description: t('layout:cookies.necessary.description'),
            cookieName: 'necessary',
          },
          {
            optional: true,
            displayName: t('layout:cookies.func.displayName'),
            description: t('layout:cookies.func.description'),
            cookieName: 'func',
          },
          {
            optional: true,
            displayName: t('layout:cookies.stats.displayName'),
            description: t('layout:cookies.stats.description'),
            cookieName: 'stats',
          },
        ]}
        resetConsentOnInit={false}
        onConsent={() => {
          // FIXME: do stuff with cookies?
        }}
      />
    </div>
  );
}
