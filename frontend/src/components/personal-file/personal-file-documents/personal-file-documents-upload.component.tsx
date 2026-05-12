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
    .test('required', 'Välj en fil', (value) => !!value)
    .required('Välj en fil'),
  attachmentCatgory: yup.string().required('Välj en kategori'),
});

export const PersonalFileDocumentsUpload: React.FC<{ emp: Employment; personId: string | undefined }> = ({
  emp,
  personId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const user = useUserStore((s) => s.user);
  const uploadDocument = useDocumentStore((s) => s.uploadDocument);
  const getDocuments = useDocumentStore((s) => s.getDocumentList);
  const documentTypes = useDocumentStore((s) => s.documentTypes);

  const [fileError, setFileError] = useState<string>('');

  const toastMessage = useSnackbar();
  const { t } = useTranslation();

  const closeHandler = () => {
    reset();
    setIsOpen(false);
  };

  const { register, watch, reset, setValue, getValues, formState, trigger } =
    useForm<PersonalFileUploadDocumentFormModel>({
      resolver: yupResolver(formSchema),
      defaultValues: {
        attachment: undefined,
        attachmentCatgory: 'EMPLOYMENT_CERTIFICATE',
      },
      mode: 'onChange', // NOTE: Needed if we want to disable submit until valid
    });

  // eslint-disable-next-line react-hooks/incompatible-library, @typescript-eslint/no-unused-vars
  const attachment = watch('attachment');

  useEffect(() => {
    const allowedTypes = ['pdf'];
    if (getValues()?.attachment) {
      const attachmentTypeget: string = getValues()?.attachment[0]?.name.split('.').pop() || '';
      if (!allowedTypes.includes(attachmentTypeget) && attachmentTypeget !== '') {
        setFileError('Fel filtyp, välj en pdf');
      } else {
        setFileError('');
      }
    }
  }, [getValues]);

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
            <FormLabel className="">
              <div role="input" className="flex justify-between w-full">
                <span className="text-label-small">{t('common:chosenFile')}</span>{' '}
                <span className="sk-link text-vattjom-text-primary font-normal hover:cursor-pointer">Bläddra</span>
              </div>
              <Input
                className="hidden"
                type="file"
                placeholder={t('common:choseFileToAdd')}
                {...register('attachment')}
                //allowReplace={false}
              />
              <Input
                className="w-full"
                value={getValues()?.attachment ? getValues()?.attachment[0]?.name : ''}
                readOnly
                placeholder={t('common:browseDocuments')}
              />
            </FormLabel>
          </FormControl>
          <FormControl className="w-full">
            <FormLabel className="text-label-small">{t('common:assignCategory')}</FormLabel>
            <Select
              onChange={(e) => {
                setValue('attachmentCatgory', e.target.value, { shouldDirty: true });
                trigger('attachmentCatgory');
              }}
              value={getValues().attachmentCatgory ? getValues().attachmentCatgory : ''}
              className="w-full"
            >
              {documentTypes?.map((type, idx) => {
                return (
                  <Select.Option key={`type-${idx}`} value={type.type}>
                    {type.displayName}
                  </Select.Option>
                );
              })}
            </Select>
          </FormControl>
          {fileError !== '' && <FormErrorMessage className="text-error">{fileError}</FormErrorMessage>}
        </Modal.Content>
        <Modal.Footer>
          <Button
            className="w-full"
            onClick={() => {
              const body: CreateDocument = {
                createdBy: user.username,
                confidentiality: {
                  confidential: false,
                },
                archive: false,
                description: `${documentTypes ? documentTypes.find((t) => t.type === getValues().attachmentCatgory)?.displayName : 'Anställningsbevis'} för timavlönad`,
                metadataList: [
                  {
                    key: 'employmentId',
                    // IMPORTANT NOTE: change empRowId to employmentId before production
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
                type: getValues().attachmentCatgory,
              };

              return uploadDocument(body, getValues().attachment[0])
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
                    reset({ attachment: undefined, attachmentCatgory: 'EMPLOYMENT_CERTIFICATE' });
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
            disabled={
              fileError.length !== 0 ||
              (!formState.dirtyFields.attachment && !formState.dirtyFields.attachmentCatgory) ||
              getValues().attachment === undefined ||
              getValues().attachmentCatgory === undefined ||
              !getValues().attachmentCatgory.length
            }
          >
            {t('common:upload')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
