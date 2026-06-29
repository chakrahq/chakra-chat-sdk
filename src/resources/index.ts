import type { HttpClient } from "../http/client.js";
import { WhatsAppResource } from "./whatsapp/index.js";

/**
 * Root resource namespace. Add new API domains here as the SDK grows.
 */
export class Resources {
  readonly whatsapp: WhatsAppResource;

  constructor(http: HttpClient) {
    this.whatsapp = new WhatsAppResource(http);
  }
}

export { WhatsAppResource } from "./whatsapp/index.js";
