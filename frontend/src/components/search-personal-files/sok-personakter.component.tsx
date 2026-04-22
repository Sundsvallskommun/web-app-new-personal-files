'use client';

import { Button, FormErrorMessage, FormLabel, SearchField, Spinner, Table, useSnackbar } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Employment } from '@interfaces/employee/employee';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { useRouter } from 'next/navigation';
import { SearchPersonalFileIcon } from '@components/app-icon/search-personal-file-icon.component';

const SokPersonakter: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [isSearch, setIsSearch] = useState(false);
  const [message, setMessage] = useState('');
  const setEmploymentslist = useEmployeeStore((s) => s.setEmployments);
  const employmentslist = useEmployeeStore((s) => s.employmentslist);
  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const getADUserEmployments = useEmployeeStore((s) => s.getADUserEmployments);
  const setEmployeeUserEmployments = useEmployeeStore((s) => s.setEmployeeUserEmployments);
  const empIsLoading = useEmployeeStore((s) => s.empIsLoading);
  const setEmpIsLoading = useEmployeeStore((s) => s.setEmpIsLoading);
  const { t } = useTranslation();
  const router = useRouter();
  const toastMessage = useSnackbar();

  const searchResultOfAD = async () => {
    const personalNumber = query.replace('-', '');
    await getADUserEmployments(personalNumber)
      .then((res) => {
        console.log('res.data', res.data);
        setIsSearch(true);
        const employments: Employment[] = [];
        if (res.data) {
          res.data.map((users) =>
            users.employments
              ? users.employments.map((emp) => {
                  if (emp?.isManual === false) {
                    employments.push(emp);
                  }
                })
              : null
          );
        }

        if (employments.length === 0) {
          setIsSearch(false);
          setEmployeeUserEmployments([]);
          toastMessage({
            position: 'bottom',
            closeable: false,
            message: 'Det gick inte att hitta någon timavlönad personakt under det här personnumret',
            status: 'error',
          });
        }

        setEmploymentslist(employments);
      })
      .catch(() => {
        toastMessage({
          position: 'bottom',
          closeable: false,
          message: 'Det gick inte att hitta någon personakt under det här personnumret',
          status: 'error',
        });
      });
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
        setMessage('Personnumret måste innehålla siffror och efterlikna följande struktur: ååååmmddnnnn');
      } else {
        setMessage('');
      }
    } else {
      setMessage('');
    }
  }, [query]);

  console.log(employeeEmployments);

  return (
    <>
      <SearchPersonalFileIcon />
      <h1>{t('common:searchPersonalFile')}</h1>
      <section className="w-full flex flex-col justify-center items-center gap-24">
        <div className="max-w-[590px] w-full pt-16 px-24 pb-24 shadow-100 rounded-button">
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
        ) : isSearch && employmentslist.length !== 0 ? (
          <Table data-cy="personalfile-result-table" className="max-w-[590px] w-full" background={true}>
            <Table.Header>
              <Table.HeaderColumn>{t('common:name')}</Table.HeaderColumn>
              <Table.HeaderColumn>{t('common:personalNumber')}</Table.HeaderColumn>
              <Table.HeaderColumn>{t('common:workTitle')}</Table.HeaderColumn>
              <Table.HeaderColumn className="hidden">Knapp Öppna personakt</Table.HeaderColumn>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Column data-cy={`pf-name`}>
                  <span className="font-bold">
                    {employeeEmployments[0].givenname} {employeeEmployments[0].lastname}
                  </span>
                </Table.Column>
                <Table.Column data-cy={`pf-personnumber`}>{employeeEmployments[0].personNumber}</Table.Column>
                <Table.Column data-cy={`pf-numberofemployments`}>
                  {employmentslist
                    .filter((emp) => (employmentslist.length > 1 ? emp.isMainEmployment : emp))
                    .map((emp) => {
                      return <span key={`employment-${emp.employmentId}`}>{emp.title}</span>;
                    })}
                </Table.Column>
                <Table.Column data-cy={`pf-openbutton`}>
                  <Button
                    variant="tertiary"
                    onClick={() => {
                      setEmpIsLoading(true);
                      router.push(`sok-personakt/${employeeEmployments[0].personId}`);
                    }}
                  >
                    {t('common:openPersonalFile')}
                  </Button>
                </Table.Column>
              </Table.Row>
            </Table.Body>
          </Table>
        ) : (
          <></>
        )}
      </section>
    </>
  );
};

export default SokPersonakter;
