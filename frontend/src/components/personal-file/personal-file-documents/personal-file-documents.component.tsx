import { Employment } from '@interfaces/employee/employee';
import { useDocumentStore } from '@services/document-service/document-service';
import { Disclosure, Divider, Icon, Spinner } from '@sk-web-gui/react';
import { File } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PersonalFileDocuments: React.FC<{ emp: Employment }> = ({ emp }) => {
  const { t } = useTranslation();
  const documentListIsLoading = useDocumentStore((s) => s.documentsIsLoading);
  const documents = useDocumentStore((s) => s.documentList);

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
