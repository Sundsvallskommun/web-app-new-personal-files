'use client';

import { Button, cx } from '@sk-web-gui/react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'lodash';



export const LogoutButton: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = () => {
    router.push('/logout');
  };

  const logOutString = capitalize(t('common:logout'));

  return (
    <div className="flex justify-center">
      <Button
        data-cy="logout-button"
        onClick={handleLogout}
        variant="secondary"
        size="md"
        color="primary"
        className={cx('w-full hover:bg-dark-ghost')}
        aria-label={logOutString}
      >
        {logOutString}
      </Button>
    </div>
  );
};
