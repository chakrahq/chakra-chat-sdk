/**
 * File input accepted for public media upload in Node.js and browser environments.
 */
export type UploadableFile = Blob | ArrayBuffer | Uint8Array;

export interface UploadPublicMediaParams {
  /** WhatsApp plugin ID. */
  pluginId: string;
  /** File to upload. */
  file: UploadableFile;
  /** Optional filename override. */
  filename?: string;
}

export interface UploadPublicMediaResponse {
  publicMediaUrl: string;
}
