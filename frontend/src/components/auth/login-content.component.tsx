'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Icon } from '@sk-web-gui/react';
import EmptyLayout from '@layouts/empty-layout/empty-layout.component';
import LoaderFullScreen from '@components/loader/loader-fullscreen';
import { appURL } from '@utils/app-url';
import { useTranslation } from 'react-i18next';
import { apiURL } from '@utils/api-url';
import { capitalize } from 'lodash';
import { Info } from 'lucide-react';

const LoginContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const { t } = useTranslation();

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const isLoggedOut = searchParams.get('loggedout') === '';
  const failMessage = searchParams.get('failMessage');
  const showLogin = isLoggedOut || (!!failMessage && failMessage !== 'NOT_AUTHORIZED');

  const onLogin = useCallback(() => {
    const searchPath = searchParams.get('path');
    const nonLoginPath = !pathName?.match(/\/login/) && pathName; // Contains path as long as it's not /login
    const nonLoginSearch = !searchPath?.match(/\/login|\/logout/) && searchPath; // Contains redirect path as long as it's not /login or /logout
    const path = nonLoginPath || nonLoginSearch || `${process.env.NEXT_PUBLIC_BASE_PATH}/`;

    const url = new URL(apiURL('/saml/login'));
    const queries = new URLSearchParams({
      successRedirect: `${appURL(path as string)}`,
      failureRedirect: `${appURL()}/login`,
    });
    url.search = queries.toString();
    // NOTE: send user to login with SSO
    router.push(url.toString());
  }, [router, searchParams, pathName]);

  useEffect(() => {
    if (!showLogin) {
      onLogin();
      return;
    }

    if (failMessage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMessage(t(`login:errors.${failMessage}`));
    }
    setIsLoading(false);
  }, [showLogin, failMessage, onLogin, t]);

  useEffect(() => {
    if (!isLoading) initialFocusRef.current?.focus();
  }, [isLoading]);

  if (isLoading) {
    return (
      <EmptyLayout>
        <LoaderFullScreen />
      </EmptyLayout>
    );
  }

  return (
    <EmptyLayout>
      <main>
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-5xl w-full flex flex-col text-light-primary bg-inverted-background-content p-20 shadow-lg text-left rounded-cards">
            <div className="mb-14">
              <h1 className="mb-10 text-xl">{process.env.NEXT_PUBLIC_APP_NAME}</h1>
              <p className="my-0">{t('login:description')}</p>
            </div>

            <Button inverted onClick={onLogin} ref={initialFocusRef} data-cy="loginButton">
              {capitalize(t('common:login'))}
            </Button>

            {errorMessage && (
              <p className="flex gap-8 mt-lg text-inverted-error items-center" role="alert">
                <Icon icon={<Info />} size={21} /> {errorMessage}
              </p>
            )}
          </div>
        </div>
      </main>
    </EmptyLayout>
  );
};

export default LoginContent;
