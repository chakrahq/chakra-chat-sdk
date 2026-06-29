/**
 * WhatsApp Cloud API message payload (pass-through).
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
 * @see https://apidocs.chakrahq.com/api-11313675
 */
export interface WhatsAppSessionMessage {
  messaging_product: "whatsapp";
  recipient_type?: "individual";
  to: string;
  type: string;
  template?: {
    name: string;
    language: {
      policy: string;
      code: string;
    };
    components?: Array<{
      type: string;
      parameters?: unknown[];
      [key: string]: unknown;
    }>;
  };
  text?: { body: string };
  image?: { link: string; caption?: string };
  video?: { link: string; caption?: string };
  document?: { link: string; filename?: string; caption?: string };
  audio?: { link: string };
  interactive?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Parameters for sending a WhatsApp session message via the pass-through API.
 */
export interface SendSessionMessageParams {
  /** WhatsApp plugin ID. */
  pluginId: string;
  /** WhatsApp API version (e.g. `v19.0`). */
  whatsappApiVersion: string;
  /** WhatsApp phone number ID used to send the message. */
  whatsappPhoneNumberId: string;
  /** WhatsApp Cloud API message payload. */
  message: WhatsAppSessionMessage;
}

export interface SendSessionMessageResponse {
  whatsappMessageId: string;
}
