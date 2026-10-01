import DefaultLayout from '@layouts/default-layout/default-layout.component';
import React, { ReactNode } from 'react';

type Props = Readonly<{
  children: ReactNode;
}>;

export default function MinaMedarbetareLayout({ children }: Props) {
  return (
    <DefaultLayout>
      <div className="flex-grow">{children}</div>
    </DefaultLayout>
  );
}
