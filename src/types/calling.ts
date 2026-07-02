import type { RequestOptions } from "./common.js";

/**
 * Common parameters for WhatsApp Calling pass-through APIs.
 */
export interface WhatsAppCallingBaseParams {
  /** WhatsApp API version (e.g. `v22.0`). */
  whatsappApiVersion: string;
  /** WhatsApp phone number ID. */
  whatsappPhoneNumberId: string;
}

export interface WhatsAppSessionPayload {
  sdp_type: "offer" | "answer";
  sdp: string;
}

export interface WhatsappWebRtcSession {
  peerConnection: RTCPeerConnection;
  localStream: MediaStream;
  getSessionPayload: () => WhatsAppSessionPayload;
  applyRemoteSession: (remote: WhatsAppSessionPayload) => Promise<void>;
  waitForConnection: (timeoutMs?: number) => Promise<void>;
  enableLocalAudio: () => Promise<void>;
  close: () => void;
}

export type WhatsAppCallAction =
  | "connect"
  | "pre_accept"
  | "accept"
  | "reject"
  | "terminate";

export interface WhatsAppCallRecordingOptions {
  status: "ENABLED" | "DISABLED";
  purpose?: string;
  announcement_language?: string;
}

export interface WhatsAppCallTranscriptionOptions {
  status: "ENABLED" | "DISABLED";
  purpose?: string;
  announcement_language?: string;
}

/**
 * Request body for POST /{phone_number_id}/calls (Meta Cloud API format).
 */
export interface WhatsAppCallsRequestBody {
  messaging_product: "whatsapp";
  action?: WhatsAppCallAction;
  call_id?: string;
  to?: string;
  recipient?: string;
  session?: WhatsAppSessionPayload;
  biz_opaque_callback_data?: string;
  recording?: WhatsAppCallRecordingOptions;
  transcription?: WhatsAppCallTranscriptionOptions;
}

export interface WhatsAppCallsSuccessResponse {
  messaging_product: "whatsapp";
  success?: boolean;
  calls?: Array<{ id: string }>;
}

export interface WhatsAppCallHoursWeeklyEntry {
  day_of_week:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  open_time: string;
  close_time: string;
}

export interface WhatsAppCallHoursHolidayEntry {
  date: string;
  start_time: string;
  end_time: string;
}

export interface WhatsAppCallingSettings {
  status?: "ENABLED" | "DISABLED";
  call_icon_visibility?: "DEFAULT" | "DISABLE ALL";
  callback_permission_status?: "ENABLED" | "DISABLED";
  call_hours?: {
    status?: "ENABLED" | "DISABLED";
    timezone_id?: string;
    weekly_operating_hours?: WhatsAppCallHoursWeeklyEntry[];
    holiday_schedule?: WhatsAppCallHoursHolidayEntry[];
  };
  sip?: WhatsAppSipSettings;
}

export interface WhatsAppSipServer {
  hostname: string;
  port?: number;
  request_uri_user_params?: Record<string, string>;
  sip_user_password?: string;
}

export interface WhatsAppSipSettings {
  status?: "ENABLED" | "DISABLED";
  servers?: WhatsAppSipServer[];
}

export interface WhatsAppPhoneNumberSettings {
  calling?: WhatsAppCallingSettings;
  sip?: WhatsAppSipSettings;
  storage_configuration?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WhatsAppUpdateSettingsRequestBody {
  calling?: WhatsAppCallingSettings;
  [key: string]: unknown;
}

export interface WhatsAppUpdateSettingsResponse {
  success?: boolean;
}

export interface WhatsAppCallPermissionActionLimit {
  time_period: string;
  max_allowed: number;
  current_usage: number;
  limit_expiration_time?: number;
}

export interface WhatsAppCallPermissionAction {
  action_name: "send_call_permission_request" | "start_call" | string;
  can_perform_action: boolean;
  limits?: WhatsAppCallPermissionActionLimit[];
}

export interface WhatsAppCallPermissionsResponse {
  messaging_product: "whatsapp";
  permission?: {
    status?: "no_permission" | "temporary" | string;
    expiration_time?: number;
    can_call?: boolean;
  };
  actions?: WhatsAppCallPermissionAction[];
}

export interface GetCallingSettingsParams extends WhatsAppCallingBaseParams {
  /** Include SIP credentials in the response. */
  includeSipCredentials?: boolean;
}

export interface UpdateCallingSettingsParams extends WhatsAppCallingBaseParams {
  settings: WhatsAppUpdateSettingsRequestBody;
}

export interface GetCallPermissionsParams extends WhatsAppCallingBaseParams {
  /** WhatsApp user phone number (digits only). */
  userWaId?: string;
  /** Business-scoped user ID (BSUID). */
  recipient?: string;
}

export interface ConnectCallParams extends WhatsAppCallingBaseParams {
  /** Callee phone number (digits only). Required unless `recipient` is provided. */
  to?: string;
  /** Business-scoped user ID (BSUID). Alternative to `to`. */
  recipient?: string;
  /**
   * WebRTC SDP offer. When omitted, the SDK creates one automatically (browser only).
   */
  session?: WhatsAppSessionPayload;
  /** Local WebRTC session when you created the offer yourself. */
  webrtcSession?: WhatsappWebRtcSession;
  bizOpaqueCallbackData?: string;
  recording?: WhatsAppCallRecordingOptions;
  transcription?: WhatsAppCallTranscriptionOptions;
}

export interface ConnectCallResult extends WhatsAppCallsSuccessResponse {
  /** Present when the SDK auto-created the WebRTC offer. */
  session?: WhatsappWebRtcSession;
}

export interface SessionCallParams extends WhatsAppCallingBaseParams {
  callId: string;
  session: WhatsAppSessionPayload;
  bizOpaqueCallbackData?: string;
  recording?: WhatsAppCallRecordingOptions;
  transcription?: WhatsAppCallTranscriptionOptions;
}

export type PreAcceptCallParams = SessionCallParams;
export type AcceptCallParams = SessionCallParams;

export interface RejectCallParams extends WhatsAppCallingBaseParams {
  callId: string;
  bizOpaqueCallbackData?: string;
}

export type TerminateCallParams = RejectCallParams;

export interface WebRtcCallingClientConfig extends WhatsAppCallingBaseParams {}

export interface InitiateOutboundCallParams {
  to?: string;
  recipient?: string;
  bizOpaqueCallbackData?: string;
  recording?: WhatsAppCallRecordingOptions;
  transcription?: WhatsAppCallTranscriptionOptions;
}

export interface AcceptInboundCallParams {
  callId: string;
  remoteOffer: WhatsAppSessionPayload;
  bizOpaqueCallbackData?: string;
  recording?: WhatsAppCallRecordingOptions;
  transcription?: WhatsAppCallTranscriptionOptions;
}

export interface CallActionParams {
  callId: string;
  bizOpaqueCallbackData?: string;
  recording?: WhatsAppCallRecordingOptions;
  transcription?: WhatsAppCallTranscriptionOptions;
}

export interface CompleteOutboundCallParams {
  remoteAnswer: WhatsAppSessionPayload;
}

export interface WhatsAppCallingRequestOptions extends RequestOptions {}
