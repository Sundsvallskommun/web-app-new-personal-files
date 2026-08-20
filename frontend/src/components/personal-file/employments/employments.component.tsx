'use client';

import { Employee } from '@interfaces/employee/employee';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@services/user-service/user-service';
import { hasPermission } from '@utils/has-permission';
import { hasSystemRole } from '@utils/has-system-role';
import { PATH } from '@utils/constants';
import React from 'react';
import { EmploymentCard } from '@components/personal-file/employments/employment-card/employment-card.component';
import { DocumentsUpload } from '@components/personal-file/documents/documents-upload.component';
import { Documents } from '@components/personal-file/documents/documents.component';

export const Employments: React.FC<{ employee: Employee[] }> = ({ employee }) => {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { CANREADOWNDOCS, CANUPLOAD } = hasPermission(user);
  const { adminRole } = hasSystemRole(user);
  const pathName = usePathname();

  const person = employee[0];
  const employments = person?.employments ?? [];

  return (
    <section>
      {!pathName.includes('min') && <h4 className="mb-16">{t('common:ongoingEmployments')}</h4>}
      {employments.length > 0 ? (
        employments.map((emp) => (
          <EmploymentCard
            key={emp.employmentId}
            data={{ ...emp, variant: 'ongoing' }}
            headerSlot={
              ((CANUPLOAD && !adminRole) || (adminRole && !pathName.includes(PATH.myPersonalFile))) && (
                <DocumentsUpload emp={emp} personId={person.personId} />
              )
            }
            footerSlot={CANREADOWNDOCS && <Documents emp={emp} personId={person.personId} />}
          />
        ))
      ) : (
        <p>{t('common:noEmploymentsToShow')}</p>
      )}
    </section>
  );
};
