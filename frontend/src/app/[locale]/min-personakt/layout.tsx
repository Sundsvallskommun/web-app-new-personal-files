import { CookieConsentSection } from '@components/cookie-consent-section/cookie-consent-section.component';
import DefaultLayout from '@layouts/default-layout/default-layout.component';
import React from 'react';

export default function MinPersonaktLayout({ children }: { children: React.ReactNode }) {
  return (
    <DefaultLayout>
      <div className="flex-grow">{children}</div>
      <CookieConsentSection />
    </DefaultLayout>
  );
}
