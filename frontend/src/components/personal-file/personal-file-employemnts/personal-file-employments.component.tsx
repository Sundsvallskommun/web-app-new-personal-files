import { Divider } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';

export const PersonalFileEmployments: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section>
      <Divider.Section>{t('common:ongoingEmployments')}</Divider.Section>
    </section>
  );
};
