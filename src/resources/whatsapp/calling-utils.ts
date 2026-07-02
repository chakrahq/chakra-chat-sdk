import { ChakraChatError } from "../../errors.js";

interface PassThroughErrorBody {
  _errors?: string[];
}

export function assertConnectSessionOffer(session: {
  sdp_type?: string;
  sdp?: string;
}): void {
  if (session.sdp_type !== "offer" || !session.sdp?.trim()) {
    throw new Error(
      'WebRTC SDP offer is required (session.sdp_type must be "offer" and session.sdp must be provided)',
    );
  }
}

export function assertPassThroughResponse<T>(body: unknown): T {
  const errorBody = body as PassThroughErrorBody;
  if (Array.isArray(errorBody._errors) && errorBody._errors.length > 0) {
    throw new ChakraChatError(errorBody._errors[0] ?? "WhatsApp API request failed", {
      statusCode: 400,
      errors: errorBody._errors,
      responseBody: body,
    });
  }

  return body as T;
}

export function buildCallingBasePath(
  buildPath: (...segments: string[]) => string,
  whatsappApiVersion: string,
  whatsappPhoneNumberId: string,
): string {
  return `/v1/whatsapp/${buildPath(whatsappApiVersion, whatsappPhoneNumberId)}`;
}
