import { useLoadDocuments } from '@hooks/use-load-documents';
import { DocumentDataList } from '@interfaces/document/document';
import { Employment } from '@interfaces/employee/employee';
import { useDocumentStore } from '@services/document-service/document-service';
import { useUserStore } from '@services/user-service/user-service';
import {
  Button,
  DialogContextType,
  Disclosure,
  Divider,
  Icon,
  PopupMenu,
  Spinner,
  useConfirm,
  useSnackbar,
} from '@sk-web-gui/react';
import { hasPermission } from '@utils/has-permission';
import { File, Ellipsis, Eye, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PersonalFileDocuments: React.FC<{
  emp: Employment;
  personId: string | undefined;
}> = ({ emp, personId }) => {
  const { t } = useTranslation();

  const user = useUserStore((s) => s.user);

  const documentListIsLoading = useDocumentStore((s) => s.documentsIsLoading);
  const documents = useDocumentStore((s) => s.documentList);
  const getDocument = useDocumentStore((s) => s.getDocument);
  const getDocumentList = useDocumentStore((s) => s.getDocumentList);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);

  const { CANREADOWNDOCS, CANDELETEDOCS } = hasPermission(user);

  const toastMessage = useSnackbar();
  const deleteConfirm: DialogContextType = useConfirm();

  useLoadDocuments(personId, emp);

  const filteredDocuments = documents?.filter((doc) => doc.employmentId === emp.empRowId) ?? [];

  const refreshDocuments = async () => {
    await getDocumentList([
      {
        key: 'employmentId',
        matchesAny: [emp?.empRowId || ''],
      },
      {
        key: 'partyId',
        matchesAny: [personId || ''],
      },
    ]);
  };

  const downloadDocument = (document: DocumentDataList, file: string) => {
    const uri = `data:${document.mimeType};base64,${file}`;
    const link = globalThis.document.createElement('a');

    link.href = uri;
    link.setAttribute('download', document.originalName);
    globalThis.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDeleteDocument = async (document: DocumentDataList) => {
    try {
      const res = await deleteDocument(document.registrationNumber, document.id);

      if (!res) {
        return;
      }

      toastMessage({
        position: 'bottom',
        closeable: false,
        message: 'Dokumentet togs bort',
        status: 'success',
      });

      await refreshDocuments();
    } catch {
      toastMessage({
        position: 'bottom',
        closeable: false,
        message: 'Dokumentet kunde inte tas bort',
        status: 'error',
      });
    }
  };

  const onDeleteDocument = async (document: DocumentDataList) => {
    const confirmed = await deleteConfirm.showConfirmation(
      'Är du säker?',
      'Om du tar bort dokumentet försvinner den från anställningen.',
      'Ja',
      'Nej',
      'info',
      'info'
    );

    if (confirmed) {
      await handleDeleteDocument(document);
    }
  };

  const onOpenDocument = async (document: DocumentDataList) => {
    const res = await getDocument(document.registrationNumber, document.id);

    if (typeof res?.data === 'string') {
      downloadDocument(document, res.data);
    }
  };

  const renderTitle = () => {
    if (documentListIsLoading) {
      return (
        <>
          {t('common:document')} <Spinner size={2} />
        </>
      );
    }

    return `${t('common:document')} (${filteredDocuments.length})`;
  };

  const renderContent = () => {
    if (documentListIsLoading) {
      return <Spinner size={4} />;
    }

    if (filteredDocuments.length === 0) {
      return <span>{t('common:noDocuments')}</span>;
    }

    return (
      <div className="flex flex-col gap-8" data-cy="document-list">
        {filteredDocuments.map((doc, idx) => (
          <div key={`doc-${doc.id}`}>
            <div className="flex justify-between items-center p-12">
              <div className="flex items-center gap-8">
                <div className="self-center bg-vattjom-surface-accent w-44 h-44 flex flex-col justify-center items-center rounded">
                  <Icon icon={<File />} size={24} />
                </div>

                <p>
                  <strong className="block">{doc.fileName}</strong> {doc.dateTime}
                </p>
              </div>

              <div className="self-center relative mr-20">
                <PopupMenu position={filteredDocuments.length - 1 === idx ? 'over' : 'under'}>
                  <PopupMenu.Button size="md" aria-label="Alternativ" inverted>
                    <Ellipsis />
                  </PopupMenu.Button>

                  <PopupMenu.Panel>
                    <PopupMenu.Items>
                      <PopupMenu.Group>
                        {CANREADOWNDOCS && (
                          <PopupMenu.Item>
                            <Button
                              leftIcon={<Icon icon={<Eye />} />}
                              variant="ghost"
                              onClick={() => void onOpenDocument(doc)}
                            >
                              {t('common:open')}
                            </Button>
                          </PopupMenu.Item>
                        )}

                        {CANDELETEDOCS && (
                          <PopupMenu.Item>
                            <Button
                              variant="ghost"
                              leftIcon={<Icon icon={<Trash />} />}
                              onClick={() => void onDeleteDocument(doc)}
                            >
                              Ta bort
                            </Button>
                          </PopupMenu.Item>
                        )}
                      </PopupMenu.Group>
                    </PopupMenu.Items>
                  </PopupMenu.Panel>
                </PopupMenu>
              </div>
            </div>

            {filteredDocuments.length > 1 && idx !== filteredDocuments.length - 1 && <Divider />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Disclosure className="w-full px-16" variant="alt">
      <Disclosure.Header>
        <Disclosure.Title>{renderTitle()}</Disclosure.Title>
        <Disclosure.Button />
      </Disclosure.Header>

      <Disclosure.Content>{renderContent()}</Disclosure.Content>
    </Disclosure>
  );
};
