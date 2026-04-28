'use client';

import { PATH } from '@utils/constants';
import { usePathname } from 'next/navigation';

export const useIsMyPersonalFile = () => {
  const pathname = usePathname();

  return !!pathname?.includes(PATH.myPersonalFile);
};
