'use client';

import { useEffect } from 'react';
import { useDocumentStore } from '@services/document-service/document-service';
import { MetaData } from '@interfaces/document/document';

export const useLoadDocuments = (personId?: string) => {
      const getDocumentList = useDocumentStore((s) => s.getDocumentList);
  useEffect(() => {
  const getDocuments = async (): Promise<void> => {
    if (!personId) {
      return;
    }

    const metadata: MetaData[] = [
      {
        key: 'partyId',
        matchesAny: [personId],
      },
    ];

    await getDocumentList(metadata);
  };
  getDocuments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId])
};