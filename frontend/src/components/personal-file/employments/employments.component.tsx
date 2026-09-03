'use client';

import { Employee, NormalizedEmployment } from '@interfaces/employee/employee';
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
import { useManagesEmployment } from '@hooks/use-manages-employment';

export const Employments: React.FC<{ employee: Employee[]; allEmployments: NormalizedEmployment[] }> = ({
  employee,
  allEmployments,
}) => {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { CANREADOWNDOCS, CANUPLOAD } = hasPermission(user);
  const { adminRole } = hasSystemRole(user);
  const pathName = usePathname();

  const person = employee[0];
  const employments = person?.employments ?? [];

  const managesEmployment = useManagesEmployment(person?.personId);
  const canUpload = (CANUPLOAD && !adminRole) || (adminRole && !pathName.includes(PATH.myPersonalFile));

  return (
    <section>
      <h4 className="mb-16">{t('common:ongoingEmployments')}</h4>
      {employments.length > 0 ? (
        employments.map((emp) => (
          <EmploymentCard
            key={emp.employmentId}
            data={{ ...emp, variant: 'ongoing' }}
            headerSlot={
              canUpload &&
              managesEmployment(emp.employmentId) && (
                <DocumentsUpload emp={emp} personId={person.personId} employments={allEmployments} />
              )
            }
            footerSlot={
              CANREADOWNDOCS && <Documents emp={emp} personId={person.personId} employments={allEmployments} />
            }
          />
        ))
      ) : (
        <p>{t('common:noEmploymentsToShow')}</p>
      )}
    </section>
  );
};
