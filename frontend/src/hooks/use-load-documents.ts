'use client';

import { useEffect } from 'react';
import { useDocumentStore } from '@services/document-service/document-service';
import { Employment } from '@interfaces/employee/employee';

export const useLoadDocuments = (personId?: string, emp?: Employment) => {
  const getDocumentList = useDocumentStore((s) => s.getDocumentList);
  useEffect(() => {
    const getDocuments = async (): Promise<void> => {
      if (!personId) {
        return;
      }

      const metadata = [
        {
          key: 'employmentId',
          value: `${emp?.employmentId}`,
        },
        {
          key: 'partyId',
          matchesAny: [personId],
        },
      ];

      await getDocumentList(metadata);
    };
    getDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, emp]);
};
