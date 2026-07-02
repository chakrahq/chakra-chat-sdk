import type { HttpClient } from "../../http/client.js";
import type {
  AcceptCallParams,
  ConnectCallParams,
  ConnectCallResult,
  GetCallPermissionsParams,
  GetCallingSettingsParams,
  PreAcceptCallParams,
  RejectCallParams,
  TerminateCallParams,
  UpdateCallingSettingsParams,
  WhatsAppCallPermissionsResponse,
  WhatsAppCallingRequestOptions,
  WhatsAppCallsRequestBody,
  WhatsAppCallsSuccessResponse,
  WhatsAppPhoneNumberSettings,
  WhatsAppUpdateSettingsResponse,
} from "../../types/calling.js";
import {
  assertConnectSessionOffer,
  assertPassThroughResponse,
  buildCallingBasePath,
} from "./calling-utils.js";
import { createOutboundOfferSession } from "./webrtc-session.js";
import { WebRtcCallingClient } from "./webrtc-calling-client.js";

export class CallingResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get Calling API settings for a business phone number.
   * @see https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/reference
   */
  async getSettings(
    params: GetCallingSettingsParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<WhatsAppPhoneNumberSettings> {
    const { whatsappApiVersion, whatsappPhoneNumberId, includeSipCredentials } = params;
    const path = `${buildCallingBasePath(this.http.buildPath.bind(this.http), whatsappApiVersion, whatsappPhoneNumberId)}/settings`;

    const response = await this.http.get<unknown>(path, {
      ...options,
      query: includeSipCredentials
        ? { include_sip_credentials: "true" }
        : undefined,
    });

    return assertPassThroughResponse<WhatsAppPhoneNumberSettings>(response);
  }

  /**
   * Configure or update Calling API settings for a business phone number.
   */
  async updateSettings(
    params: UpdateCallingSettingsParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<WhatsAppUpdateSettingsResponse> {
    const { whatsappApiVersion, whatsappPhoneNumberId, settings } = params;
    const path = `${buildCallingBasePath(this.http.buildPath.bind(this.http), whatsappApiVersion, whatsappPhoneNumberId)}/settings`;

    const response = await this.http.post<unknown>(path, settings, options);
    return assertPassThroughResponse<WhatsAppUpdateSettingsResponse>(response);
  }

  /**
   * Get the call permission state for a WhatsApp user.
   */
  async getPermissions(
    params: GetCallPermissionsParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<WhatsAppCallPermissionsResponse> {
    const { whatsappApiVersion, whatsappPhoneNumberId, userWaId, recipient } = params;
    const path = `${buildCallingBasePath(this.http.buildPath.bind(this.http), whatsappApiVersion, whatsappPhoneNumberId)}/call_permissions`;

    const response = await this.http.get<unknown>(path, {
      ...options,
      query: {
        user_wa_id: userWaId,
        recipient,
      },
    });

    return assertPassThroughResponse<WhatsAppCallPermissionsResponse>(response);
  }

  /**
   * Initiate an outbound call (`action: connect`).
   *
   * Creates a WebRTC SDP offer automatically when `session` is not provided (browser only).
   */
  async connect(
    params: ConnectCallParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<ConnectCallResult> {
    if (!params.to && !params.recipient) {
      throw new Error("Either to or recipient is required to initiate an outbound call");
    }

    let webrtcSession = params.webrtcSession;
    let session = params.session ?? webrtcSession?.getSessionPayload();

    if (!session) {
      webrtcSession = await createOutboundOfferSession({ holdLocalAudio: true });
      session = webrtcSession.getSessionPayload();
    }

    assertConnectSessionOffer(session);

    const response = await this.sendCallRequest(
      {
        whatsappApiVersion: params.whatsappApiVersion,
        whatsappPhoneNumberId: params.whatsappPhoneNumberId,
      },
      {
        messaging_product: "whatsapp",
        action: "connect",
        to: params.to,
        recipient: params.recipient,
        session,
        biz_opaque_callback_data: params.bizOpaqueCallbackData,
        recording: params.recording,
        transcription: params.transcription,
      },
      options,
    );

    return { ...response, session: webrtcSession };
  }

  /**
   * Pre-accept an inbound call (`action: pre_accept`).
   */
  async preAccept(
    params: PreAcceptCallParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<WhatsAppCallsSuccessResponse> {
    return this.sendCallRequest(
      params,
      {
        messaging_product: "whatsapp",
        action: "pre_accept",
        call_id: params.callId,
        session: params.session,
        biz_opaque_callback_data: params.bizOpaqueCallbackData,
        recording: params.recording,
        transcription: params.transcription,
      },
      options,
    );
  }

  /**
   * Accept an inbound call (`action: accept`).
   */
  async accept(
    params: AcceptCallParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<WhatsAppCallsSuccessResponse> {
    return this.sendCallRequest(
      params,
      {
        messaging_product: "whatsapp",
        action: "accept",
        call_id: params.callId,
        session: params.session,
        biz_opaque_callback_data: params.bizOpaqueCallbackData,
        recording: params.recording,
        transcription: params.transcription,
      },
      options,
    );
  }

  /**
   * Reject an inbound call (`action: reject`).
   */
  async reject(
    params: RejectCallParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<WhatsAppCallsSuccessResponse> {
    return this.sendCallRequest(
      params,
      {
        messaging_product: "whatsapp",
        action: "reject",
        call_id: params.callId,
        biz_opaque_callback_data: params.bizOpaqueCallbackData,
      },
      options,
    );
  }

  /**
   * Terminate an active call (`action: terminate`).
   */
  async terminate(
    params: TerminateCallParams,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<WhatsAppCallsSuccessResponse> {
    return this.sendCallRequest(
      params,
      {
        messaging_product: "whatsapp",
        action: "terminate",
        call_id: params.callId,
        biz_opaque_callback_data: params.bizOpaqueCallbackData,
      },
      options,
    );
  }

  /**
   * High-level WebRTC calling client using native `RTCPeerConnection`.
   * SDP from Meta webhooks must be received by your app and passed into the client methods.
   */
  createWebRtcClient(
    config: ConstructorParameters<typeof WebRtcCallingClient>[1],
  ): WebRtcCallingClient {
    return new WebRtcCallingClient(this, config);
  }

  private async sendCallRequest(
    params: { whatsappApiVersion: string; whatsappPhoneNumberId: string },
    body: WhatsAppCallsRequestBody,
    options?: WhatsAppCallingRequestOptions,
  ): Promise<WhatsAppCallsSuccessResponse> {
    const { whatsappApiVersion, whatsappPhoneNumberId } = params;
    const path = `${buildCallingBasePath(this.http.buildPath.bind(this.http), whatsappApiVersion, whatsappPhoneNumberId)}/calls`;

    const response = await this.http.post<unknown>(path, body, options);
    return assertPassThroughResponse<WhatsAppCallsSuccessResponse>(response);
  }
}
