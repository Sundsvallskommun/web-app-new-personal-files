import type { ReactNode } from 'react';

type Props = Readonly<{
  children: ReactNode;
}>;

export default function MedarbetareLayout({ children }: Props) {
  return <div className="flex-grow pt-40">{children}</div>;
}
