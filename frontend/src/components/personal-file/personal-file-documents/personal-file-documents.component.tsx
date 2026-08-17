import { DocumentDataList } from '@interfaces/document/document';
import { Employment } from '@interfaces/employee/employee';
import { buildPersonDocumentsMetadata, useDocumentStore } from '@services/document-service/document-service';
import { useUserStore } from '@services/user-service/user-service';
import {
  Button,
  DialogContextType,
  Disclosure,
  FileUpload,
  Icon,
  PopupMenu,
  Spinner,
  useConfirm,
  useSnackbar,
} from '@sk-web-gui/react';
import { hasPermission } from '@utils/has-permission';
import { Eye, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PersonalFileDocuments: React.FC<{
  emp: Employment;
  personId: string | undefined;
  employments: Employment[];
}> = ({ emp, personId, employments }) => {
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

  const filteredDocuments = documents?.filter((doc) => doc.employmentId === `${emp.employmentId}`) ?? [];

  const refreshDocuments = async () => {
    await getDocumentList(buildPersonDocumentsMetadata(personId ?? '', employments));
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
        message: t('common:documentDeleted'),
        status: 'success',
      });

      await refreshDocuments();
    } catch {
      toastMessage({
        position: 'bottom',
        closeable: false,
        message: t('common:didNotDelete'),
        status: 'error',
      });
    }
  };

  const onDeleteDocument = async (document: DocumentDataList) => {
    const confirmed = await deleteConfirm.showConfirmation(
      t('common:areYouSure'),
      t('common:ifYouDelete'),
      t('common:yes'),
      t('common:no'),
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

    const popupPanel = (doc: DocumentDataList, idx: number) => (
      <PopupMenu.Panel position={filteredDocuments.length - 1 === idx ? 'over' : 'under'}>
        <PopupMenu.Items>
          <PopupMenu.Group>
            {CANREADOWNDOCS && (
              <PopupMenu.Item>
                <Button
                  data-cy={`document-open-${doc.id}`}
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
                  data-cy={`document-delete-${doc.id}`}
                  variant="ghost"
                  leftIcon={<Icon icon={<Trash />} />}
                  onClick={() => void onDeleteDocument(doc)}
                >
                  {t('common:delete')}
                </Button>
              </PopupMenu.Item>
            )}
          </PopupMenu.Group>
        </PopupMenu.Items>
      </PopupMenu.Panel>
    );

    return (
      <div className="flex flex-col gap-8" data-cy="document-list">
        <FileUpload.List>
          {filteredDocuments.map((doc, idx) => {
            return (
              <FileUpload.ListItem key={`document-${doc.fileName}`} index={idx}>
                <FileUpload.ListItemIcon />
                <FileUpload.ListItemContent>
                  <FileUpload.ListItemContentName heading={doc.fileName} description={doc.dateTime} />
                </FileUpload.ListItemContent>
                <FileUpload.ListItemActions showMore morePopupMenuPanel={popupPanel(doc, idx)} />
              </FileUpload.ListItem>
            );
          })}
        </FileUpload.List>
      </div>
    );
  };

  return (
    <Disclosure initalOpen className="w-full px-16" variant="alt">
      <Disclosure.Header>
        <Disclosure.Title>{renderTitle()}</Disclosure.Title>
        <Disclosure.Button />
      </Disclosure.Header>

      <Disclosure.Content>{renderContent()}</Disclosure.Content>
    </Disclosure>
  );
};
