import {
  Button,
  Modal,
  FormLabel,
  FormControl,
  Select,
  Input,
  useSnackbar,
  FormErrorMessage,
  FileUpload,
} from '@sk-web-gui/react';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useDocumentStore } from '@services/document-service/document-service';
import { useUserStore } from '@services/user-service/user-service';

import { CreateDocument } from '@interfaces/document/document';
import { Employment } from '@interfaces/employee/employee';
import { Paperclip } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface PersonalFileUploadDocumentFormModel {
  attachment: Array<File>;
  attachmentCatgory: string;
}

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const user = useUserStore((s) => s.user);

  const uploadDocument = useDocumentStore((s) => s.uploadDocument);
  const getDocuments = useDocumentStore((s) => s.getDocumentList);
  const documentTypes = useDocumentStore((s) => s.documentTypes);

  const toastMessage = useSnackbar();

  const { t } = useTranslation();

  const formSchema = yup.object({
    attachment: yup
      .mixed<File[]>()
      .test('required', t('common:choseFileToAdd'), (value) => !!value?.length)
      .required(t('common:choseFileToAdd')),

    attachmentCatgory: yup.string().required('Välj en kategori'),
  });

  const { register, control, reset, setValue, formState, trigger } = useForm<PersonalFileUploadDocumentFormModel>({
    resolver: yupResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  const { ref: attachmentRef, ...attachmentRegister } = register('attachment');

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
    setFileInputKey((prev) => prev + 1);
    setIsOpen(false);
  };

  useEffect(() => {
    const allowedTypes = ['pdf'];

    const fileName = attachment?.[0]?.name;

    if (!fileName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFileError('');
      return;
    }

    const fileType = fileName.split('.').pop()?.toLowerCase() || '';

    const isAllowedFileType = allowedTypes.includes(fileType);

    if (isAllowedFileType) {
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
          <FileUpload.ListItemContentName heading={attachment?.[0]?.name} />
        </FileUpload.ListItemContent>
      </FileUpload.ListItem>
    </FileUpload.List>
  );

  const handleUpload = async () => {
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

    try {
      const res = await uploadDocument(body, attachment[0]);

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
            <Input
              key={fileInputKey}
              className="hidden"
              type="file"
              accept=".pdf"
              placeholder={t('common:choseFileToAdd')}
              {...attachmentRegister}
              ref={(element) => {
                attachmentRef(element);
                fileInputRef.current = element;
              }}
            />

            <Button
              className="w-fit"
              type="button"
              variant="tertiary"
              leftIcon={<Paperclip />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('common:attachDocument')}
            </Button>
          </FormControl>

          {attachment && attachment[0] ? itemToUpload : ''}

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
            disabled={fileError.length !== 0 || !attachment?.[0] || !attachmentCategory || !formState.isValid}
            onClick={handleUpload}
          >
            {t('common:upload')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
