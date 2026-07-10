'use client';

import { EndedEmploymentEvent } from '@interfaces/employee/employee';
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
      {endedEmployments.map((emp, idx) => {
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
            key={`ended-employment-${idx}`}
            data={normalized}
            headerSlot={canUpload && emp.empId != null && <DocumentsUpload emp={normalized} personId={personId} />}
            footerSlot={CANREADOWNDOCS && <Documents emp={normalized} personId={personId} />}
          />
        );
      })}
    </section>
  );
};
