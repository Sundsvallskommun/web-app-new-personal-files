'use client';

import { FormErrorMessage, FormLabel, SearchField, Spinner, useSnackbar } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Employee, Employment } from '@interfaces/employee/employee';
import { useEmployeeStore } from '@services/employee-service/employee-service';
import { SearchPersonalFileIcon } from '@components/app-icon/search-personal-file-icon.component';
import { SearchPersonalFilesResult } from './sok-personakter-result.component';

type FormData = {
  query: string;
};

const personalNumberRegex = /^(?:\d{12}|\d{8}-\d{4})$/;

const SokPersonakter: React.FC = () => {
  const setEmploymentslist = useEmployeeStore((s) => s.setEmployments);
  const employmentslist = useEmployeeStore((s) => s.employmentslist);
  const employeeEmployments = useEmployeeStore((s) => s.employeeEmployments);
  const getADUserEmployments = useEmployeeStore((s) => s.getADUserEmployments);
  const setEmployeeEmployments = useEmployeeStore((s) => s.setEmployeeEmployments);
  const empIsLoading = useEmployeeStore((s) => s.empIsLoading);
  const setEmpIsLoading = useEmployeeStore((s) => s.setEmpIsLoading);

  const { t } = useTranslation();
  const toastMessage = useSnackbar();

  const schema = yup.object({
    query: yup.string().required(t('common:PNMustContain')).matches(personalNumberRegex, t('common:PNMustContain')),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      query: '',
    },
  });

  const query = useWatch({
    control,
    name: 'query',
    defaultValue: '',
  });

  const isSearch = employeeEmployments.length > 0 && personalNumberRegex.test(query);

  const extractNonManualEmployments = (data: Employee[] | undefined): Employment[] => {
    if (!data) {
      return [];
    }

    return data.flatMap((user: Employee) => user.employments ?? []);
  };

  const clearSearchResults = () => {
    setEmployeeEmployments([]);
    setEmploymentslist([]);
  };

  const onSubmit = async (data: FormData) => {
    const personalNumber = data.query.replace('-', '');

    try {
      const res = await getADUserEmployments(personalNumber);
      const employments = extractNonManualEmployments(res.data);

      if (employments.length === 0) {
        clearSearchResults();
        toastMessage({
          position: 'bottom',
          closeable: false,
          message: `${t('common:NoPersonalFileFound')}`,
          status: 'error',
        });
        return;
      }

      setEmploymentslist(employments);
    } catch {
      setEmpIsLoading(false);
      clearSearchResults();
      toastMessage({
        position: 'bottom',
        closeable: false,
        message: `${t('common:NoPersonalFileFound')}`,
        status: 'error',
      });
    }
  };

  const handleReset = () => {
    reset({ query: '' });
    clearSearchResults();
  };

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

          <Controller
            name="query"
            control={control}
            render={({ field }) => (
              <SearchField
                data-cy="searchfield-personalfiles"
                className="mt-8"
                placeholder="Skriv personnummer"
                value={field.value}
                onChange={(e) => {
                  const nextQuery = e.target.value;

                  field.onChange(nextQuery);

                  if (!nextQuery || !personalNumberRegex.test(nextQuery)) {
                    clearSearchResults();
                  }
                }}
                showSearchButton={!errors.query && personalNumberRegex.test(query)}
                onSearch={() => {
                  handleSubmit(onSubmit)();
                }}
                onReset={handleReset}
              />
            )}
          />

          {errors.query?.message ? (
            <FormErrorMessage className="mt-8" data-cy="not-found-error-message">
              {errors.query.message}
            </FormErrorMessage>
          ) : null}
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
