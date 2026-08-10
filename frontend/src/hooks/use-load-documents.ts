'use client';

import { useEffect } from 'react';
import {
  buildPersonDocumentsMetadata,
  employmentIdsOf,
  useDocumentStore,
} from '@services/document-service/document-service';
import { Employment } from '@interfaces/employee/employee';

export const useLoadDocuments = (personId?: string, employments: Employment[] = []) => {
  const getDocumentList = useDocumentStore((s) => s.getDocumentList);

  const employmentIdsKey = employmentIdsOf(employments).join(',');

  useEffect(() => {
    const getDocuments = async (): Promise<void> => {
      if (!personId || !employmentIdsKey) {
        return;
      }

      await getDocumentList(buildPersonDocumentsMetadata(personId, employments));
    };
    getDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId, employmentIdsKey]);
};
