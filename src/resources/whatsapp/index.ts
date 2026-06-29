import type { HttpClient } from "../../http/client.js";
import { MediaResource } from "./media.js";
import { SessionMessagesResource } from "./session-messages.js";
import { TemplateMessagesResource } from "./template-messages.js";

export class WhatsAppResource {
  readonly templateMessages: TemplateMessagesResource;
  readonly sessionMessages: SessionMessagesResource;
  readonly media: MediaResource;

  constructor(http: HttpClient) {
    this.templateMessages = new TemplateMessagesResource(http);
    this.sessionMessages = new SessionMessagesResource(http);
    this.media = new MediaResource(http);
  }
}

export { MediaResource } from "./media.js";
export { SessionMessagesResource } from "./session-messages.js";
export { TemplateMessagesResource } from "./template-messages.js";
