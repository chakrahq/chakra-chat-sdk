import type {
  AcceptInboundCallParams,
  CallActionParams,
  CompleteOutboundCallParams,
  InitiateOutboundCallParams,
  WebRtcCallingClientConfig,
  WhatsAppCallingRequestOptions,
  WhatsappWebRtcSession,
} from "../../types/calling.js";
import type { CallingResource } from "./calling.js";
import { createInboundAnswerSession } from "./webrtc-session.js";

export interface OutboundCallResult {
  callId: string;
  session: WhatsappWebRtcSession;
}

export interface AcceptedInboundCallResult {
  callId: string;
  session: WhatsappWebRtcSession;
}

export class WebRtcCallingClient {
  constructor(
    private readonly calling: CallingResource,
    private readonly config: WebRtcCallingClientConfig,
  ) {}

  /**
   * Initiate an outbound call. Creates a WebRTC SDP offer and calls Meta `connect`.
   *
   * Your app receives the remote SDP answer via a Call Connect webhook — pass that to
   * `completeOutbound` when it arrives.
   */
  async initiateOutbound(
    params: InitiateOutboundCallParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<OutboundCallResult> {
    const response = await this.calling.connect(
      {
        ...this.config,
        ...params,
      },
      options,
    );

    const callId = response.calls?.[0]?.id;
    const session = response.session;

    if (!callId || !session) {
      session?.close();
      throw new Error("WhatsApp connect call did not return a call id or WebRTC session");
    }

    return { callId, session };
  }

  /**
   * Apply remote SDP from a Call Connect webhook and enable microphone audio.
   */
  async completeOutbound(
    session: WhatsappWebRtcSession,
    params: CompleteOutboundCallParams,
  ): Promise<void> {
    await session.applyRemoteSession(params.remoteAnswer);
    await session.waitForConnection();
    await session.enableLocalAudio();
  }

  /**
   * Accept an inbound call using Meta's recommended pre_accept + accept flow.
   *
   * Pass the SDP offer from your Call Connect webhook as `remoteOffer`.
   */
  async acceptInbound(
    params: AcceptInboundCallParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<AcceptedInboundCallResult> {
    const session = await createInboundAnswerSession(params.remoteOffer, {
      holdLocalAudio: true,
    });
    const sessionPayload = session.getSessionPayload();

    await this.calling.preAccept(
      {
        ...this.config,
        callId: params.callId,
        session: sessionPayload,
        bizOpaqueCallbackData: params.bizOpaqueCallbackData,
        recording: params.recording,
        transcription: params.transcription,
      },
      options,
    );

    await session.waitForConnection();

    await this.calling.accept(
      {
        ...this.config,
        callId: params.callId,
        session: sessionPayload,
        bizOpaqueCallbackData: params.bizOpaqueCallbackData,
        recording: params.recording,
        transcription: params.transcription,
      },
      options,
    );

    await session.enableLocalAudio();
    return { callId: params.callId, session };
  }

  async reject(
    params: CallActionParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<void> {
    await this.calling.reject(
      {
        ...this.config,
        callId: params.callId,
        bizOpaqueCallbackData: params.bizOpaqueCallbackData,
      },
      options,
    );
  }

  async terminate(
    params: CallActionParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<void> {
    await this.calling.terminate(
      {
        ...this.config,
        callId: params.callId,
        bizOpaqueCallbackData: params.bizOpaqueCallbackData,
      },
      options,
    );
  }
}
