import type { HttpClient } from "../../http/client.js";
import { CallingResource } from "./calling.js";
import { MediaResource } from "./media.js";
import { SessionMessagesResource } from "./session-messages.js";
import { TemplateMessagesResource } from "./template-messages.js";

export class WhatsAppResource {
  readonly templateMessages: TemplateMessagesResource;
  readonly sessionMessages: SessionMessagesResource;
  readonly media: MediaResource;
  readonly calling: CallingResource;

  constructor(http: HttpClient) {
    this.templateMessages = new TemplateMessagesResource(http);
    this.sessionMessages = new SessionMessagesResource(http);
    this.media = new MediaResource(http);
    this.calling = new CallingResource(http);
  }
}

export { CallingResource } from "./calling.js";
export { MediaResource } from "./media.js";
export { SessionMessagesResource } from "./session-messages.js";
export { TemplateMessagesResource } from "./template-messages.js";
export { WebRtcCallingClient } from "./webrtc-calling-client.js";
export type {
  AcceptedInboundCallResult,
  OutboundCallResult,
} from "./webrtc-calling-client.js";
export {
  createInboundAnswerSession,
  createOutboundOfferSession,
} from "./webrtc-session.js";
export type { WhatsappWebRtcSession } from "../../types/calling.js";
