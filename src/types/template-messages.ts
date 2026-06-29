import type { TemplateMapping } from "./common.js";

/**
 * Parameters for sending a WhatsApp template message to a phone number.
 * @see https://apidocs.chakrahq.com/api-11312774
 */
export interface SendTemplateMessageParams {
  /** WhatsApp plugin ID. */
  pluginId: string;
  /**
   * Recipient phone number — fully qualified with country code,
   * without `+` or formatting characters (e.g. `919901258433`).
   */
  toPhoneNumber: string;
  /** WhatsApp phone number ID used to send the message. */
  whatsappPhoneNumberId: string;
  /** WhatsApp template name. */
  templateName: string;
  /** Body template parameter mappings. */
  mapping?: TemplateMapping[];
  /** Public URL for an image header attachment. */
  imageUrl?: string;
  /** Public URL for a video header attachment. */
  videoUrl?: string;
  /** Public URL for a document header attachment. */
  documentUrl?: string;
  /** Filename when sending a document in the header. */
  filename?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  locationName?: string;
  locationAddress?: string;
  /** Header template parameter mappings. */
  headerMapping?: TemplateMapping[];
  /** Button template parameter mappings. */
  buttonMapping?: TemplateMapping[];
  /**
   * Language code when the same template exists in multiple languages
   * (e.g. `en`, `en_US`, `pt_BR`).
   */
  language?: string;
  /** OTP code for authentication templates. */
  otpCode?: string;
}

export interface SendTemplateMessageResponse {
  id: string;
  createdAt: number;
  updatedAt: number;
  externalId: string;
  provider: string;
  dataType: string;
  body: { body: string };
  text: string;
  attachments: null;
  deliveryStatus: string;
  direction: string;
  timestamp: number;
  context: {
    contactIdentifier: string;
    messageTemplateId: string;
  };
  adhocAgent: null;
  source: {
    sourceId: string;
    sourceType: string;
  };
  team: string;
  chat: null;
  plugin: string;
  contact: null;
  user: string;
  procedure: null;
  process: string;
  campaign: null;
  inReplyTo: null;
}
