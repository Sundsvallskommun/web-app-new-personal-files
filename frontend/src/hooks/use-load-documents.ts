'use client';

import { useEffect } from 'react';
import { useDocumentStore } from '@services/document-service/document-service';
import { Employment } from '@interfaces/employee/employee';

export const useLoadDocuments = (personId?: string, employments?: Employment[]) => {
  const getDocumentList = useDocumentStore((s) => s.getDocumentList);

  const employmentIds = (employments ?? [])
    .map((emp) => `${emp.employmentId}`)
    .filter((id) => id && id !== 'undefined');
  // Stable primitive dep so the effect only re-runs when the actual set of employments changes.
  const employmentIdsKey = employmentIds.join(',');

  useEffect(() => {
    const getDocuments = async (): Promise<void> => {
      if (!personId || employmentIds.length === 0) {
        return;
      }

      // One search for all of the person's employments (employmentId matchesAny […]) instead of one
      // request per employment — each PersonalFileDocuments filters its own slice from the shared list.
      const metadata = [
        { key: 'employmentId', matchesAny: employmentIds },
        { key: 'partyId', matchesAny: [personId] },
      ];

      await getDocumentList(metadata);
    };
    getDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, employmentIdsKey]);
};
