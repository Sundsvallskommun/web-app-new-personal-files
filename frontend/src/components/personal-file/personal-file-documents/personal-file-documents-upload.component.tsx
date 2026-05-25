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

const DEFAULT_VALUES: PersonalFileUploadDocumentFormModel = {
  attachment: [],
  attachmentCatgory: 'EMPLOYMENT_CERTIFICATE',
};

export const PersonalFileDocumentsUpload: React.FC<{
  emp: Employment;
  personId: string | undefined;
}> = ({ emp, personId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [fileError, setFileError] = useState<string>('');

  const user = useUserStore((s) => s.user);

  const uploadDocument = useDocumentStore((s) => s.uploadDocument);
  const getDocuments = useDocumentStore((s) => s.getDocumentList);
  const documentTypes = useDocumentStore((s) => s.documentTypes);

  const toastMessage = useSnackbar();

  const { t } = useTranslation();

  const formSchema: yup.ObjectSchema<PersonalFileUploadDocumentFormModel> = yup.object({
    attachment: yup.array().of(yup.mixed<FileUploadItem>().required()).min(1, t('common:choseFileToAdd')).required(),

    attachmentCatgory: yup.string().required('Välj en kategori'),
  });

  const context = useForm<PersonalFileUploadDocumentFormModel>({
    resolver: yupResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
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

  const closeHandler = () => {
    reset(DEFAULT_VALUES);
    setFileError('');
    setIsOpen(false);
  };

  useEffect(() => {
    const fileEnding = attachment?.[0]?.meta?.ending?.toLowerCase();

    if (!fileEnding) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFileError('');
      return;
    }

    if (fileEnding === 'pdf') {
      setFileError('');
    } else {
      setFileError(t('common:wrongFileType'));
    }
  }, [attachment, t]);

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
    if (!attachment?.[0]?.file) {
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
            matchesAny: [emp.empRowId ?? ''],
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

          {attachment?.[0]?.file ? itemToUpload : null}

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

                void trigger('attachmentCatgory');
              }}
            >
              {documentTypes?.map((type) => (
                <Select.Option key={`type-${type.type}`} value={type.type}>
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
            disabled={fileError.length !== 0 || !attachment?.[0]?.file || !attachmentCategory || !formState.isValid}
            onClick={handleUpload}
          >
            {t('common:upload')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
