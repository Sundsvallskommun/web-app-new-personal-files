'use client';

import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { hasSystemRole } from '@utils/has-system-role';
import { PATH } from '@utils/constants';
import React from 'react';
import {
  EmploymentCard,
  NormalizedEmployment,
} from '@components/personal-file/employments/employment-card/employment-card.component';
import { DocumentsUpload } from '@components/personal-file/documents/documents-upload.component';
import { Documents } from '@components/personal-file/documents/documents.component';
import { EndedEmploymentEvent } from '@data-contracts/backend/data-contracts';

interface Props {
  endedEmployments: EndedEmploymentEvent[];
  personId: string | undefined;
}

export const EndedEmployments: React.FC<Props> = ({ endedEmployments, personId }) => {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { CANREADOWNDOCS, CANUPLOAD } = hasPermission(user);
  const { adminRole } = hasSystemRole(user);
  const pathName = usePathname();

  return (
    <section className="my-48">
      <h4 className="mb-16">{t('common:endedEmployments')}</h4>
      {endedEmployments.map((emp) => {
        const normalized: NormalizedEmployment = {
          employmentId: emp.empId ?? undefined,
          title: emp.title,
          companyId: emp.companyId,
          topOrgId: emp.topOrgId,
          topOrgName: emp.topOrgName,
          orgName: emp.orgName,
          startDate: emp.hireDate,
          endDate: emp.retireDate,
        };

        const canUpload = (CANUPLOAD && !adminRole) || (adminRole && !pathName.includes(PATH.myPersonalFile));

        return (
          <EmploymentCard
            key={`${emp.title}-${emp.hireDate}-${emp.retireDate}`}
            data={normalized}
            headerSlot={canUpload && emp.empId != null && <DocumentsUpload emp={normalized} personId={personId} />}
            footerSlot={CANREADOWNDOCS && <Documents emp={normalized} personId={personId} />}
          />
        );
      })}
    </section>
  );
};
