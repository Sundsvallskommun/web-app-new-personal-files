import { Button, Modal, FormLabel, FormControl, Select, Input, useSnackbar, FormErrorMessage } from '@sk-web-gui/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useDocumentStore } from '@services/document-service/document-service';
import { useUserStore } from '@services/user-service/user-service';

import { CreateDocument } from '@interfaces/document/document';
import { Employment } from '@interfaces/employee/employee';

import { useTranslation } from 'react-i18next';

export interface PersonalFileUploadDocumentFormModel {
  attachment: Array<File>;
  attachmentCatgory: string;
}

const formSchema = yup.object({
  attachment: yup
    .mixed<File[]>()
    .test('required', 'Välj en fil', (value) => !!value?.length)
    .required('Välj en fil'),

  attachmentCatgory: yup.string().required('Välj en kategori'),
});

const DEFAULT_VALUES: PersonalFileUploadDocumentFormModel = {
  attachment: undefined as unknown as File[],
  attachmentCatgory: 'EMPLOYMENT_CERTIFICATE',
};

export const PersonalFileDocumentsUpload: React.FC<{
  emp: Employment;
  personId: string | undefined;
}> = ({ emp, personId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileError, setFileError] = useState<string>('');
  const [fileInputKey, setFileInputKey] = useState(0);

  const user = useUserStore((s) => s.user);

  const uploadDocument = useDocumentStore((s) => s.uploadDocument);
  const getDocuments = useDocumentStore((s) => s.getDocumentList);
  const documentTypes = useDocumentStore((s) => s.documentTypes);

  const toastMessage = useSnackbar();

  const { t } = useTranslation();

  const { register, watch, reset, setValue, formState, trigger } = useForm<PersonalFileUploadDocumentFormModel>({
    resolver: yupResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  const attachment = watch('attachment');
  const attachmentCategory = watch('attachmentCatgory');

  const closeHandler = () => {
    reset(DEFAULT_VALUES);
    setFileError('');
    setFileInputKey((prev) => prev + 1);
    setIsOpen(false);
  };

  useEffect(() => {
    const allowedTypes = ['pdf'];

    const fileName = attachment?.[0]?.name;

    if (!fileName) {
      setFileError('');
      return;
    }

    const fileType = fileName.split('.').pop()?.toLowerCase() || '';

    if (!allowedTypes.includes(fileType)) {
      setFileError('Fel filtyp, välj en pdf');
    } else {
      setFileError('');
    }
  }, [attachment]);

  return (
    <div>
      <Button data-cy="upload-document" size="sm" variant="primary" onClick={() => setIsOpen(true)}>
        {t('common:uploadDocument')}
      </Button>

      <Modal label={t('common:uploadDocument')} className="max-w-[320px] w-full" show={isOpen} onClose={closeHandler}>
        <Modal.Content className="flex flex-col gap-20">
          <div className="flex flex-col gap-8">
            <FormLabel>{t('common:workTitle')}</FormLabel>
            <span>{emp.title}</span>
          </div>

          <FormControl className="w-full">
            <FormLabel>
              <div role="input" className="flex justify-between w-full">
                <span className="text-label-small">{t('common:chosenFile')}</span>

                <span className="sk-link text-vattjom-text-primary font-normal hover:cursor-pointer">Bläddra</span>
              </div>

              <Input
                key={fileInputKey}
                className="hidden"
                type="file"
                accept=".pdf"
                placeholder={t('common:choseFileToAdd')}
                {...register('attachment')}
              />

              <Input
                className="w-full"
                value={attachment?.[0]?.name ?? ''}
                readOnly
                placeholder={t('common:browseDocuments')}
              />
            </FormLabel>
          </FormControl>

          <FormControl className="w-full">
            <FormLabel className="text-label-small">{t('common:assignCategory')}</FormLabel>

            <Select
              className="w-full"
              value={attachmentCategory ?? ''}
              onChange={(e) => {
                setValue('attachmentCatgory', e.target.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });

                trigger('attachmentCatgory');
              }}
            >
              {documentTypes?.map((type, idx) => (
                <Select.Option key={`type-${idx}`} value={type.type}>
                  {type.displayName}
                </Select.Option>
              ))}
            </Select>
          </FormControl>

          {fileError !== '' && <FormErrorMessage className="text-error">{fileError}</FormErrorMessage>}
        </Modal.Content>

        <Modal.Footer>
          <Button
            className="w-full"
            disabled={fileError.length !== 0 || !attachment?.[0] || !attachmentCategory || !formState.isValid}
            onClick={() => {
              if (!attachment?.[0]) {
                return;
              }

              const body: CreateDocument = {
                createdBy: user.username,

                confidentiality: {
                  confidential: false,
                },

                archive: false,

                description: `${
                  documentTypes?.find((t) => t.type === attachmentCategory)?.displayName ?? 'Anställningsbevis'
                } för timavlönad`,

                metadataList: [
                  {
                    key: 'employmentId',
                    value: `${emp.empRowId}`,
                  },
                  {
                    key: 'partyId',
                    value: `${personId}`,
                  },
                  {
                    key: 'startDate',
                    value: `${emp.startDate}`,
                  },
                  {
                    key: 'endDate',
                    value: `${emp.endDate}`,
                  },
                ],

                type: attachmentCategory,
              };

              return uploadDocument(body, attachment[0])
                .then(async (res) => {
                  if (res.data) {
                    toastMessage({
                      position: 'bottom',
                      closeable: false,
                      message: 'Dokumentet laddades upp',
                      status: 'success',
                    });

                    await getDocuments([
                      {
                        key: 'employmentId',
                        matchesAny: [emp.empRowId ?? ''],
                      },
                      {
                        key: 'partyId',
                        matchesAny: [personId || ''],
                      },
                    ]);

                    closeHandler();
                  }
                })
                .catch(() => {
                  toastMessage({
                    position: 'bottom',
                    closeable: false,
                    message: 'Dokumentet gick inte att ladda upp',
                    status: 'error',
                  });
                });
            }}
          >
            {t('common:upload')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
