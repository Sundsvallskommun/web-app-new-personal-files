import { OverviewSidebar } from '@components/sidebar/overview-sidebar.component';
import EmptyLayout from '@layouts/empty-layout/empty-layout.component';
import React from 'react';

export default function SokPersonaktLayout({ children }: { children: React.ReactNode }) {
  return (
    <EmptyLayout>
      <div className="flex">
        <OverviewSidebar />
        <div className="flex-grow">{children}</div>
      </div>
    </EmptyLayout>
  );
}
