import type { HttpClient } from "../../http/client.js";
import type { ChakraApiResponse, RequestOptions } from "../../types/common.js";
import type {
  SendSessionMessageParams,
  SendSessionMessageResponse,
} from "../../types/session-messages.js";

export class SessionMessagesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Send a WhatsApp session message via the Cloud API pass-through endpoint.
   * @see https://apidocs.chakrahq.com/api-11313675
   */
  async send(
    params: SendSessionMessageParams,
    options?: RequestOptions,
  ): Promise<SendSessionMessageResponse> {
    const { pluginId, whatsappApiVersion, whatsappPhoneNumberId, message } = params;

    const path = `/v1/ext/plugin/whatsapp/${this.http.buildPath(pluginId)}/api/${this.http.buildPath(whatsappApiVersion)}/${this.http.buildPath(whatsappPhoneNumberId)}/messages`;

    const response = await this.http.post<ChakraApiResponse<SendSessionMessageResponse>>(
      path,
      message,
      options,
    );

    return response._data;
  }
}
