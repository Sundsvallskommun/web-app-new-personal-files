'use client';

import { OverviewSidebar } from '@components/sidebar/overview-sidebar.component';
import { Link } from '@sk-web-gui/react';
import NextLink from 'next/link';
import { useTranslation } from 'react-i18next';
import { InfoBanner } from '@components/info-banner/info-banner.component';
import React from 'react';

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
        <div className="w-full flex">
          <div className="w-full justify-center">
            <InfoBanner />
            <div className="mx-auto max-w-[1024px] w-full px-48">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
