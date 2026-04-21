import { Employment } from '@interfaces/employee/employee';
import { useDocumentStore } from '@services/document-service/document-service';
import { Disclosure, Divider, Icon, Spinner } from '@sk-web-gui/react';
import { File } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PersonalFileDocuments: React.FC<{ emp: Employment }> = ({ emp }) => {
  const { t } = useTranslation();
  const documentListIsLoading = useDocumentStore((s) => s.documentsIsLoading);
  const documents = useDocumentStore((s) => s.documentList);
  return (
    <Disclosure className="w-full px-16" variant="alt">
      <Disclosure.Header>
        <Disclosure.Title>
          {documentListIsLoading ? (
            <>
              {t('common:document')} <Spinner size={2} />
            </>
          ) : documents?.length !== 0 ? (
            `${t('common:document')} (${documents?.length})`
          ) : (
            `${t('common:document')} (0)`
          )}
        </Disclosure.Title>
        <Disclosure.Button />
      </Disclosure.Header>
      <Disclosure.Content>
        {documentListIsLoading ? (
          <Spinner size={4} />
        ) : documents && documents?.length !== 0 ? (
          <div className="flex flex-col gap-8" data-cy="document-list">
            {documents
              .filter(
                (doc) =>
                  //IMPORTANT NOTE: change empRowId to employmentId before production
                  //DOUBLE CHECK INTERFACE TYPES
                  doc.employmentId === emp.empRowId
              )
              .map((doc, idx) => (
                <div key={`doc-${doc.id}`}>
                  <div className="flex justify-between items-center p-12">
                    <div className="flex items-center gap-8">
                      <div
                        className={`self-center bg-vattjom-surface-accent w-44 h-44 flex flex-col justify-center items-center rounded`}
                      >
                        <Icon icon={<File />} size={24} />
                      </div>
                      <p>
                        <strong className="block">{doc.fileName}</strong> {doc.dateTime}
                      </p>
                    </div>
                  </div>
                  {documents.length > 1 && idx !== documents.length - 1 ? <Divider /> : <></>}
                </div>
              ))}
          </div>
        ) : (
          <span>{t('common:noDocuments')}</span>
        )}
      </Disclosure.Content>
    </Disclosure>
  );
};
