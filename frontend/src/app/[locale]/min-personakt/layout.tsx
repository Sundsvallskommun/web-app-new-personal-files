import { CookieConsentSection } from "@components/cookie-consent-section/cookie-consent-section.component";
import { OverviewSidebar } from "@components/sidebar/overview-sidebar.component";
import DefaultLayout from "@layouts/default-layout/default-layout.component";
import EmptyLayout from "@layouts/empty-layout/empty-layout.component";
import React from "react";

export default function MinPersonaktLayout({ children }: { children: React.ReactNode }) { 
    return (
    <DefaultLayout>
        <div className="flex-grow">{children}</div>
      <CookieConsentSection />
    </DefaultLayout>
  )
}