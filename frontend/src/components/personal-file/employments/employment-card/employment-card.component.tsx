'use client';

import { useFoundationObjectStore } from '@services/foundation-object/foundation-object-service';
import { FormLabel, Label, Table } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import React from 'react';

export interface NormalizedEmployment {
  employmentId?: number;
  title?: string | null;
  formOfEmploymentId?: string | null;
  companyId?: number;
  topOrgId?: number;
  topOrgName?: string | null;
  orgName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

interface Props {
  data: NormalizedEmployment;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
}

export const EmploymentCard: React.FC<Props> = ({ data, headerSlot, footerSlot }) => {
  const { t } = useTranslation();
  const formOfEmployments = useFoundationObjectStore((s) => s.formOfEmployments);
  const companies = useFoundationObjectStore((s) => s.companies);

  return (
    <Table background className="mb-16">
      <Table.Header>
        <Table.HeaderColumn>
          <div className="flex justify-between items-center w-full">
            <span>{data.title}</span>
            {headerSlot}
          </div>
        </Table.HeaderColumn>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Column className="flex-col flex-wrap">
            <div className="flex justify-between gap-40 py-16 px-16 w-full">
              <div className="flex flex-col gap-24">
                <div className="flex flex-col">
                  <FormLabel className="mb-4">{t('common:workTitle')}</FormLabel>
                  <Label className="w-fit" inverted>
                    {data.title}
                  </Label>
                </div>
                <div className="flex flex-col">
                  <FormLabel className="mb-4">{t('common:formOfEmployment')}</FormLabel>
                  <Label className="w-fit" inverted>
                    {data.formOfEmploymentId
                      ? (formOfEmployments.find((x) => x?.foeId === data.formOfEmploymentId)?.description ??
                        t('common:unknown'))
                      : formOfEmployments.length === 0
                        ? t('common:hourlyPaid')
                        : t('common:unknown')}
                  </Label>
                </div>
              </div>
              <div className="flex flex-col gap-24">
                <div className="flex flex-col">
                  <FormLabel>{t('common:municipality')}</FormLabel>
                  <p>
                    {companies.length !== 0
                      ? companies.find((x) => x?.companyId === data.companyId)?.displayName
                      : t('common:missingInformation')}
                  </p>
                </div>
                <div className="flex flex-col">
                  <FormLabel>{t('common:management')}</FormLabel>
                  <p>{data.topOrgName}</p>
                </div>
              </div>
              <div className="flex flex-col gap-24">
                <div className="flex flex-col">
                  <FormLabel>{t('common:unit')}</FormLabel>
                  <p>{data.orgName}</p>
                </div>
                <div className="flex flex-col">
                  <FormLabel>{t('common:employmentPeriodLabel')}</FormLabel>
                  <p>
                    {data.startDate
                      ? t('common:employmentPeriod', {
                          start: dayjs(data.startDate).format('YYYY-MM-DD'),
                          end: data.endDate ? dayjs(data.endDate).format('YYYY-MM-DD') : t('common:ongoing'),
                        })
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
            {footerSlot}
          </Table.Column>
        </Table.Row>
      </Table.Body>
    </Table>
  );
};
