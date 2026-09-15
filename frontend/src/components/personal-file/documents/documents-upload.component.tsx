import {
  Button,
  Modal,
  FormLabel,
  FormControl,
  Select,
  useSnackbar,
  FormErrorMessage,
  FileUpload,
} from '@sk-web-gui/react';
import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { buildPersonDocumentsMetadata, useDocumentStore } from '@services/document-service/document-service';
import { useUserStore } from '@services/user-service/user-service';
import { CreateDocument, FileUploadItem, PersonalFileUploadDocumentFormModel } from '@interfaces/document/document';
import { useTranslation } from 'react-i18next';
import { MAX_FILE_SIZE_MB, UPLOAD_DOCUMENT_DEFAULT_VALUES } from '@utils/constants';
import { NormalizedEmployment } from '@interfaces/employee/employee';

export const DocumentsUpload: React.FC<{
  emp: NormalizedEmployment;
  personId: string | undefined;
  employments: NormalizedEmployment[];
}> = ({ emp, personId, employments }) => {
  const [isOpen, setIsOpen] = useState(false);

  const user = useUserStore((s) => s.user);

  const uploadDocument = useDocumentStore((s) => s.uploadDocument);
  const getDocuments = useDocumentStore((s) => s.getDocumentList);
  const documentTypes = useDocumentStore((s) => s.documentTypes);

  const toastMessage = useSnackbar();

  const { t } = useTranslation();

  const formSchema: yup.ObjectSchema<PersonalFileUploadDocumentFormModel> = yup.object({
    attachment: yup.array().of(yup.mixed<FileUploadItem>().required()).min(1, t('common:choseFileToAdd')).required(),
    attachmentCategory: yup.string().required(t('common:chooseCategory')),
  });

  const context = useForm<PersonalFileUploadDocumentFormModel>({
    resolver: yupResolver(formSchema),
    defaultValues: UPLOAD_DOCUMENT_DEFAULT_VALUES,
    mode: 'onChange',
  });

  const { control, reset, setValue, setError, formState, trigger } = context;

  const attachmentRegister = context.register('attachment', {
    required: true,
  });

  const attachment = useWatch({
    control,
    name: 'attachment',
  });

  const attachmentCategory = useWatch({
    control,
    name: 'attachmentCategory',
  });

  const attachmentError = formState.errors.attachment?.message;
  const categoryError = formState.errors.attachmentCategory?.message;

  const closeHandler = () => {
    reset(UPLOAD_DOCUMENT_DEFAULT_VALUES);
    setIsOpen(false);
  };

  const handleInvalidFile = (message: string) => {
    setValue('attachment', [], { shouldDirty: true });
    setError('attachment', { type: 'manual', message });
  };

  const itemToUpload = (
    <FileUpload.List>
      <FileUpload.ListItem index={1}>
        <FileUpload.ListItemIcon />
        <FileUpload.ListItemContent>
          <FileUpload.ListItemContentName heading={attachment?.[0]?.meta.name ?? ''} />
        </FileUpload.ListItemContent>
      </FileUpload.ListItem>
    </FileUpload.List>
  );

  const handleUpload = async () => {
    const isValid = await trigger();

    if (!isValid || !attachment?.[0]?.file) {
      return;
    }

    const body: CreateDocument = {
      createdBy: user.username,
      confidentiality: {
        confidential: false,
      },
      archive: false,
      description: documentTypes?.find((t) => t.type === attachmentCategory)?.displayName ?? '',
      metadataList: [
        {
          key: 'employmentId',
          value: `${emp.employmentId}`,
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
        {
          key: 'topOrgId',
          value: `${emp.topOrgId}`,
        },
        {
          key: 'companyId',
          value: `${emp.companyId}`,
        },
      ],
      type: attachmentCategory,
    };

    try {
      const res = await uploadDocument(body, attachment[0].file);

      if (res.data) {
        toastMessage({
          position: 'bottom',
          closeable: false,
          message: t('common:successfullyUploaded'),
          status: 'success',
        });

        await getDocuments(buildPersonDocumentsMetadata(personId ?? '', employments));

        closeHandler();
      }
    } catch {
      toastMessage({
        position: 'bottom',
        closeable: false,
        message: t('common:wasNotUploaded'),
        status: 'error',
      });
    }
  };

  return (
    <div>
      <Button data-cy="upload-document" size="sm" variant="primary" onClick={() => setIsOpen(true)}>
        {t('common:uploadDocument')}
      </Button>

      <Modal label={t('common:uploadDocument')} className="max-w-[500px] w-full" show={isOpen} onClose={closeHandler}>
        <Modal.Content className="flex flex-col gap-20">
          <div className="flex flex-col gap-8">
            <FormLabel>{t('common:workTitle')}</FormLabel>
            <span>{emp.title}</span>
          </div>

          <FormControl className="w-full">
            <FileUpload.Field
              {...attachmentRegister}
              allowMultiple={false}
              accept={['application/pdf']}
              maxFileSizeMB={MAX_FILE_SIZE_MB}
              onInvalid={handleInvalidFile}
              className="w-full"
            />

            <div className="w-full">
              {attachmentError && <FormErrorMessage className="text-error">{attachmentError}</FormErrorMessage>}
            </div>
          </FormControl>

          {attachment?.[0]?.file && !attachmentError ? itemToUpload : null}

          <FormControl className="w-full">
            <FormLabel className="text-label-small">{t('common:assignCategory')}</FormLabel>

            <Select
              className="w-full"
              value={attachmentCategory ?? ''}
              onChange={(e) => {
                setValue('attachmentCategory', e.target.value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });

                trigger('attachmentCategory');
              }}
            >
              <Select.Option value="" disabled>
                {t('common:chooseCategory')}
              </Select.Option>

              {documentTypes?.map((type) => (
                <Select.Option key={`type-${type.type}`} value={type.type}>
                  {type.displayName}
                </Select.Option>
              ))}
            </Select>

            {categoryError && <FormErrorMessage className="text-error">{categoryError}</FormErrorMessage>}
          </FormControl>
        </Modal.Content>

        <Modal.Footer>
          <Button className="w-full" data-cy="upload-button" onClick={handleUpload}>
            {t('common:upload')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
