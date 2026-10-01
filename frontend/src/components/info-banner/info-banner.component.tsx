import React from 'react';
import { Icon, Link } from '@sk-web-gui/react';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const InfoBanner: React.FC = () => {
  const { t } = useTranslation('common');
  return (
    <div className="bg-background-200" aria-label="Informationsmeddelande">
      <div className="flex items-center py-16 px-24">
        <Icon size={20} icon={<Info />} color="tertiary" />
        <p className="pl-12">
          {t('common:infoBanner.text')}
          <Link href={t('common:infoBanner.linkUrl')} external variant="tertiary">
            {t('common:infoBanner.linkText')}
          </Link>
        </p>
      </div>
    </div>
  );
};
