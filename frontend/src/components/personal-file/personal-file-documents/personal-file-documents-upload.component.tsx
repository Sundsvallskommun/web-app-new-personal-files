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

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useDocumentStore } from '@services/document-service/document-service';
import { useUserStore } from '@services/user-service/user-service';

import { CreateDocument, FileUploadItem, PersonalFileUploadDocumentFormModel } from '@interfaces/document/document';
import { Employment } from '@interfaces/employee/employee';

import { useTranslation } from 'react-i18next';

import { Paperclip } from 'lucide-react';
import { MAX_FILE_SIZE, UPLOAD_DOCUMENT_DEFAULT_VALUES } from '@utils/constants';

export const PersonalFileDocumentsUpload: React.FC<{
  emp: Employment;
  personId: string | undefined;
}> = ({ emp, personId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileTypeError, setFileTypeError] = useState<string>('');

  const user = useUserStore((s) => s.user);

  const uploadDocument = useDocumentStore((s) => s.uploadDocument);
  const getDocuments = useDocumentStore((s) => s.getDocumentList);
  const documentTypes = useDocumentStore((s) => s.documentTypes);

  const toastMessage = useSnackbar();

  const { t } = useTranslation();

  const formSchema: yup.ObjectSchema<PersonalFileUploadDocumentFormModel> = yup.object({
    attachment: yup
      .array()
      .of(yup.mixed<FileUploadItem>().required())
      .min(1, t('common:choseFileToAdd'))
      .test('fileSize', t('common:fileTooLarge'), (files) => {
        const file = files?.[0]?.file;

        if (!file) {
          return true;
        }

        return file.size <= MAX_FILE_SIZE;
      })
      .required(),

    attachmentCatgory: yup.string().required('Välj en kategori'),
  });

  const context = useForm<PersonalFileUploadDocumentFormModel>({
    resolver: yupResolver(formSchema),
    defaultValues: UPLOAD_DOCUMENT_DEFAULT_VALUES,
    mode: 'onChange',
  });

  const { control, reset, setValue, formState, trigger } = context;

  const attachmentRegister = context.register('attachment', {
    required: true,
  });

  const attachment = useWatch({
    control,
    name: 'attachment',
  });

  const attachmentCategory = useWatch({
    control,
    name: 'attachmentCatgory',
  });

  const attachmentError = formState.errors.attachment?.message;

  const closeHandler = () => {
    reset(UPLOAD_DOCUMENT_DEFAULT_VALUES);
    setFileTypeError('');
    setIsOpen(false);
  };

  useEffect(() => {
    trigger('attachment');

    const fileEnding = attachment?.[0]?.meta?.ending?.toLowerCase();

    if (!fileEnding) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFileTypeError('');
      return;
    }

    if (fileEnding === 'pdf') {
      setFileTypeError('');
    } else {
      setFileTypeError(t('common:wrongFileType'));
    }
  }, [attachment, t, trigger]);

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

    if (!isValid || fileTypeError || !attachment?.[0]?.file) {
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

        await getDocuments([
          {
            key: 'employmentId',
            matchesAny: [`${emp.employmentId}`],
          },
          {
            key: 'partyId',
            matchesAny: [personId || ''],
          },
        ]);

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
            <FileUpload.Area>
              <div className="flex flex-col gap-lg">
                <FileUpload.Button {...attachmentRegister}>
                  <Button variant="tertiary" leftIcon={<Paperclip />}>
                    {t('common:attachDocument')}
                  </Button>
                </FileUpload.Button>
              </div>
            </FileUpload.Area>
          </FormControl>

          {attachment?.[0]?.file && formState.isValid && fileTypeError.length === 0 ? itemToUpload : null}

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
              <Select.Option value="" disabled>
                {t('common:chooseCategory')}
              </Select.Option>

              {documentTypes?.map((type) => (
                <Select.Option key={`type-${type.type}`} value={type.type}>
                  {type.displayName}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
          <div className="w-full">
            {attachmentError && <FormErrorMessage className="text-error">{attachmentError}</FormErrorMessage>}

            {fileTypeError !== '' && <FormErrorMessage className="text-error">{fileTypeError}</FormErrorMessage>}
          </div>
        </Modal.Content>

        <Modal.Footer>
          <Button
            className="w-full"
            disabled={fileTypeError.length !== 0 || !attachment?.[0]?.file || !attachmentCategory || !formState.isValid}
            onClick={handleUpload}
          >
            {t('common:upload')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
