'use client';

import { FormErrorMessage, FormLabel, SearchField, Spinner, useSnackbar } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Employee, Employment } from '@interfaces/employee/employee';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { SearchPersonalFileIcon } from '@components/app-icon/search-personal-file-icon.component';
import { SearchPersonalFilesResult } from './sok-personakter-result.component';

const SokPersonakter: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [isSearch, setIsSearch] = useState(false);
  const [message, setMessage] = useState('');
  const setEmploymentslist = useEmployeeStore((s) => s.setEmployments);
  const employmentslist = useEmployeeStore((s) => s.employmentslist);
  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const getADUserEmployments = useEmployeeStore((s) => s.getADUserEmployments);
  const setEmployeeEmployments = useEmployeeStore((s) => s.setEmployeeEmployments);
  const empIsLoading = useEmployeeStore((s) => s.empIsLoading);
  const setEmpIsLoading = useEmployeeStore((s) => s.setEmpIsLoading);
  const { t } = useTranslation();
  const toastMessage = useSnackbar();

  const extractNonManualEmployments = (data: Employee[] | undefined): Employment[] => {
    if (!data) {
      return [];
    }

    return data.flatMap((user: Employee) => user.employments ?? []);
  };

  const searchResultOfAD = async () => {
    const personalNumber = query.replace('-', '');

    try {
      const res = await getADUserEmployments(personalNumber);
      const employments = extractNonManualEmployments(res.data);

      setIsSearch(true);

      if (employments.length === 0) {
        setIsSearch(false);
        setEmployeeEmployments([]);
        toastMessage({
          position: 'bottom',
          closeable: false,
          message: `${t('common:NoPersonalFileFound')}`,
          status: 'error',
        });
      }

      setEmploymentslist(employments);
    } catch {
      setEmpIsLoading(false);
      setEmployeeEmployments([]);
      setEmploymentslist([]);
      toastMessage({
        position: 'bottom',
        closeable: false,
        message: `${t('common:NoPersonalFileFound')}`,
        status: 'error',
      });
    }
  };

  useEffect(() => {
    if (employeeEmployments.length !== 0 && query.length < 12) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSearch(false);
    }
  }, [employeeEmployments, query]);

  useEffect(() => {
    if (query.length > 0) {
      if (
        query.includes('/[a-zA-Z]/') ||
        query.length < 12 ||
        query.length > 13 ||
        (query.length === 13 && query[8] !== '-')
      ) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessage(t('common:PNMustContain'));
      } else {
        setMessage('');
      }
    } else {
      setMessage('');
    }
  }, [query]);

  return (
    <>
      <SearchPersonalFileIcon />
      <h1>{t('common:searchPersonalFile')}</h1>
      <section className="w-full flex flex-col justify-center items-center gap-24">
        <div className="max-w-[776px] w-full pt-16 px-24 pb-24 shadow-100 rounded-button">
          <FormLabel>
            <span className="font-bold">{t('common:writePersonalNumber')}</span>
            <span className="text-gray-500 font-normal"> ({t('common:personalNumberStructure')})</span>
          </FormLabel>
          <SearchField
            data-cy="searchfield-personalfiles"
            value={query}
            className="mt-8"
            placeholder="Skriv personnummer"
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            showSearchButton={(query.length === 13 && query[8] === '-') || query.length === 12}
            onSearch={() => {
              if ((query.length === 13 && query[8] === '-') || query.length === 12) {
                searchResultOfAD();
              }
            }}
            onReset={() => {
              setIsSearch(false);
              setQuery('');
              setEmployeeEmployments([]);
              setEmploymentslist([]);
            }}
          />
          {message.length ? (
            <FormErrorMessage className="mt-8" data-cy="not-found-error-message">
              {message}
            </FormErrorMessage>
          ) : (
            <></>
          )}
        </div>
        {empIsLoading ? (
          <Spinner size={5} />
        ) : (
          isSearch &&
          employmentslist.length !== 0 && (
            <SearchPersonalFilesResult employeeEmployments={employeeEmployments} employmentslist={employmentslist} />
          )
        )}
      </section>
    </>
  );
};

export default SokPersonakter;
