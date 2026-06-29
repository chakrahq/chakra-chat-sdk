import type { HttpClient } from "../../http/client.js";
import type { ChakraApiResponse, RequestOptions } from "../../types/common.js";
import type {
  SendTemplateMessageParams,
  SendTemplateMessageResponse,
} from "../../types/template-messages.js";

export class TemplateMessagesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Send a WhatsApp template message to a phone number.
   * @see https://apidocs.chakrahq.com/api-11312774
   */
  async send(
    params: SendTemplateMessageParams,
    options?: RequestOptions,
  ): Promise<SendTemplateMessageResponse> {
    const { pluginId, toPhoneNumber, ...body } = params;

    const path = `/v1/ext/plugin/whatsapp/${this.http.buildPath(pluginId)}/phoneNumber/${this.http.buildPath(toPhoneNumber)}/send-template-message`;

    const response = await this.http.post<ChakraApiResponse<SendTemplateMessageResponse>>(
      path,
      body,
      options,
    );

    return response._data;
  }
}
