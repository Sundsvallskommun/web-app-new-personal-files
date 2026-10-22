import { Request } from 'express';
import multer from 'multer';

type FilterFileNameCallback = (error: Error | null, pass: boolean) => void;

const allowedMimeTypes = [
  // 'image/jpeg',
  // 'image/gif',
  // 'image/gif',
  // 'image/png',
  // 'image/tiff',
  // 'image/bmp',
  'application/pdf',
  // 'application/rtf',
  // 'application/msword',
  // 'text/plain',
  // "text/html",
  // "application/octet-stream",
  // 'application/vnd.ms-excel',
  // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // 'application/vnd.oasis.opendocument.text',
  // 'application/vnd.oasis.opendocument.spreadsheet',
  // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (_request: Request, file: Express.Multer.File, callback: FilterFileNameCallback): void => {
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  if (allowedMimeTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

const uploadOptions = () => ({
  limits: {
    fieldNameSize: 255,
    fileSize: 1024 * 1024 * 15, // 4mb
  },
  storage: multer.memoryStorage(),
  fileFilter,
});

export const fileUploadOptions = uploadOptions();
