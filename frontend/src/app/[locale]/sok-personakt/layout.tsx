import DefaultLayout from '@layouts/default-layout/default-layout.component';
import React from 'react';

export default function SokPersonaktLayout({ children }: { children: React.ReactNode }) {
  return (
    <DefaultLayout>
      <div className="flex-grow">{children}</div>
    </DefaultLayout>
  );
}
