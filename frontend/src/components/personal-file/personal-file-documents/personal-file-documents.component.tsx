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

export const PersonalFileDocuments: React.FC<{ emp: Employment; personId: string | undefined }> = ({
  emp,
  personId,
}) => {
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

  const filteredDocuments =
    documents?.filter(
      (doc) =>
        // IMPORTANT NOTE: change empRowId to employmentId before production
        doc.employmentId === emp.empRowId
    ) ?? [];

  const renderTitle = () => {
    if (documentListIsLoading) {
      return (
        <>
          {t('common:document')} <Spinner size={2} />
        </>
      );
    }

    return `${t('common:document')} (${documents?.length ?? 0})`;
  };

  const renderContent = () => {
    if (documentListIsLoading) {
      return <Spinner size={4} />;
    }

    if (filteredDocuments.length === 0) {
      return <span>{t('common:noDocuments')}</span>;
    }

    const downloadDocument = (a: DocumentDataList, file: string) => {
      const uri = `data:${a.mimeType};base64,${file}`;
      const link = document.createElement('a');
      const filename = a.originalName;
      link.href = uri;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
    };

    const onDeleteDocument = (document: DocumentDataList) => {
      if (document) {
        deleteConfirm
          .showConfirmation(
            'Är du säker?',
            'Om du tar bort dokumentet försvinner den från anställningen.',
            'Ja',
            'Nej',
            'info',
            'info'
          )
          .then((confirmed) => {
            if (confirmed) {
              deleteDocument(document.registrationNumber, document.id)
                .then(async (res) => {
                  if (res) {
                    toastMessage({
                      position: 'bottom',
                      closeable: false,
                      message: 'Dokumentet togs bort',
                      status: 'success',
                    });

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
                  }
                })
                .catch((e) => {
                  toastMessage({
                    position: 'bottom',
                    closeable: false,
                    message: 'Dokumentet kunde inte tas bort',
                    status: 'error',
                  });
                });
            }
            return confirmed ? () => true : () => {};
          });
      }
    };

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
                              onClick={() => {
                                getDocument(doc.registrationNumber, doc.id).then((res) => {
                                  if (res) {
                                    downloadDocument(doc, res.data as unknown as string);
                                  }
                                });
                              }}
                            >
                              Öppna
                            </Button>
                          </PopupMenu.Item>
                        )}
                        {CANDELETEDOCS && (
                          <PopupMenu.Item>
                            <Button
                              variant="ghost"
                              leftIcon={<Icon icon={<Trash />} />}
                              onClick={() => onDeleteDocument(doc)}
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
