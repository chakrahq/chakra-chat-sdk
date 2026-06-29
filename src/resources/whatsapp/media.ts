import type { HttpClient } from "../../http/client.js";
import type { ChakraApiResponse, RequestOptions } from "../../types/common.js";
import type {
  UploadPublicMediaParams,
  UploadPublicMediaResponse,
  UploadableFile,
} from "../../types/media.js";

export class MediaResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Upload a media file to Chakra public storage for use in WhatsApp messages.
   * @see https://apidocs.chakrahq.com/api-11313630
   */
  async uploadPublic(
    params: UploadPublicMediaParams,
    options?: RequestOptions,
  ): Promise<UploadPublicMediaResponse> {
    const { pluginId, file, filename } = params;
    const path = `/v1/ext/plugin/whatsapp/${this.http.buildPath(pluginId)}/upload-public-media`;

    const formData = new FormData();
    formData.append("file", toBlob(file), filename);

    if (filename) {
      formData.append("filename", filename);
    }

    const response = await this.http.postFormData<ChakraApiResponse<UploadPublicMediaResponse>>(
      path,
      formData,
      options,
    );

    return response._data;
  }
}

function toBlob(file: UploadableFile): Blob {
  if (file instanceof Blob) {
    return file;
  }

  const bytes = Uint8Array.from(
    file instanceof ArrayBuffer ? new Uint8Array(file) : file,
  );
  return new Blob([bytes]);
}
