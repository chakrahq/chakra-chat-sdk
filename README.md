# chakra-chat-sdk

TypeScript SDK for the [Chakra Chat](https://chakrahq.com) and WhatsApp APIs. Works in **Node.js** (18+) and **browser** environments.

## Installation

```bash
npm install chakra-chat-sdk
```

WebRTC calling uses the browser's native `RTCPeerConnection` API — no additional dependencies required.

## Quick start

```typescript
import { ChakraChat } from "chakra-chat-sdk";

const client = new ChakraChat({
  accessToken: process.env.CHAKRA_ACCESS_TOKEN,
});
```

All API requests are authenticated with the bearer access token provided at initialization.

## Configuration

```typescript
const client = new ChakraChat({
  accessToken: "your-bearer-token",       // required
  baseUrl: "https://api.chakrahq.com",      // optional, this is the default
  timeoutMs: 30000,                        // optional, default 30 seconds
  fetch: customFetch,                       // optional, for testing or polyfills
});
```


| Option        | Required | Default                    | Description                         |
| ------------- | -------- | -------------------------- | ----------------------------------- |
| `accessToken` | Yes      | —                          | Bearer token for API authentication |
| `baseUrl`     | No       | `https://api.chakrahq.com` | Chakra API base URL                 |
| `timeoutMs`   | No       | `30000`                    | Request timeout in milliseconds     |
| `fetch`       | No       | global `fetch`             | Custom fetch implementation         |




## Usage



### Send template message

Send a WhatsApp template message to a phone number.

[API docs](https://apidocs.chakrahq.com/api-11312774)

```typescript
const message = await client.whatsapp.templateMessages.send({
  pluginId: "d83e1d23-50b8-4d87-8f92-842a0ac516f6",
  toPhoneNumber: "919999999999",
  whatsappPhoneNumberId: "775966265503012",
  templateName: "christmas_promo_23",
  mapping: [
    { schemaPropertyName: "1", schemaPropertyValue: "John" },
  ],
  imageUrl: "https://example.com/promo.png",
});

console.log(message.id, message.deliveryStatus);
```

**OTP / authentication template:**

```typescript
await client.whatsapp.templateMessages.send({
  pluginId: "d83e1d23-50b8-4d87-8f92-842a0ac516f6",
  toPhoneNumber: "919999999999",
  whatsappPhoneNumberId: "105966260583426",
  templateName: "login_otp",
  otpCode: "496093",
});
```

Phone numbers must be fully qualified with country code and without `+` or formatting characters (e.g. `919999999999`, `13323458424`).

### Send session message

Send a WhatsApp session message via the Cloud API pass-through endpoint. The `message` payload follows the [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages) format.

[API docs](https://apidocs.chakrahq.com/api-11313675)

**Text message:**

```typescript
const result = await client.whatsapp.sessionMessages.send({
  pluginId: "d83e1d23-50b8-4d87-8f92-842a0ac516f6",
  whatsappApiVersion: "v19.0",
  whatsappPhoneNumberId: "775966265503012",
  message: {
    messaging_product: "whatsapp",
    to: "919999999999",
    type: "text",
    text: { body: "Hello from Chakra!" },
  },
});

console.log(result.whatsappMessageId);
```

**Template message (via pass-through):**

```typescript
await client.whatsapp.sessionMessages.send({
  pluginId,
  whatsappApiVersion: "v19.0",
  whatsappPhoneNumberId,
  message: {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: "919999999999",
    type: "template",
    template: {
      name: "hello_world",
      language: { policy: "deterministic", code: "en_US" },
      components: [{ type: "body", parameters: [] }],
    },
  },
});
```



### Upload public media

Upload a file to Chakra public storage. Use the returned URL when sending template messages with media headers.

[API docs](https://apidocs.chakrahq.com/api-11313630)

**Node.js:**

```typescript
import { readFile } from "node:fs/promises";

const file = await readFile("./image.png");

const { publicMediaUrl } = await client.whatsapp.media.uploadPublic({
  pluginId: "d83e1d23-50b8-4d87-8f92-842a0ac516f6",
  file,
  filename: "image.png",
});

console.log(publicMediaUrl);
```

**Browser:**

```typescript
const input = document.querySelector("input[type=file]") as HTMLInputElement;
const file = input.files![0];

const { publicMediaUrl } = await client.whatsapp.media.uploadPublic({
  pluginId,
  file,
  filename: file.name,
});
```

Accepted file types: `Blob`, `ArrayBuffer`, or `Uint8Array`.

> **Note:** Media uploaded via this API is publicly accessible to anyone with the URL.



### WhatsApp calling

Pass-through APIs and a WebRTC calling client for the [Meta WhatsApp Calling API](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/reference). Request and response bodies follow Meta's format.

OpenAPI spec: [`chakra-api/openapi/whatsapp-calling.yaml`](https://github.com/chakrahq/chakra-api/blob/main/openapi/whatsapp-calling.yaml)

**Webhook handling is your responsibility.** The SDK does not receive Meta webhooks. Your app should listen for calling webhook events (e.g. Call Connect, Terminate) and pass the SDP payloads into the SDK methods below when needed.

**Shared params** for all calling methods:

```typescript
const callingConfig = {
  whatsappApiVersion: "v22.0",
  whatsappPhoneNumberId: "775966265503012",
};
```



#### Pass-through APIs

**Get calling settings:**

```typescript
const settings = await client.whatsapp.calling.getSettings(callingConfig);
console.log(settings.calling?.status);
```

**Update calling settings:**

```typescript
await client.whatsapp.calling.updateSettings({
  ...callingConfig,
  settings: {
    calling: {
      status: "ENABLED",
      callback_permission_status: "ENABLED",
    },
  },
});
```

**Get call permissions for a user:**

```typescript
const permissions = await client.whatsapp.calling.getPermissions({
  ...callingConfig,
  userWaId: "919999999999",
});

console.log(permissions.permission?.status);
```

**Call actions:**

```typescript
// Outbound — SDK auto-creates the WebRTC SDP offer (browser only)
const { calls, session } = await client.whatsapp.calling.connect({
  ...callingConfig,
  to: "919999999999",
});

// Inbound — pass SDP from your webhook handler
await client.whatsapp.calling.preAccept({
  ...callingConfig,
  callId: "wacid.xxx",
  session: { sdp_type: "answer", sdp: answerSdp },
});

await client.whatsapp.calling.accept({
  ...callingConfig,
  callId: "wacid.xxx",
  session: { sdp_type: "answer", sdp: answerSdp },
});

await client.whatsapp.calling.reject({
  ...callingConfig,
  callId: "wacid.xxx",
});

await client.whatsapp.calling.terminate({
  ...callingConfig,
  callId: "wacid.xxx",
});
```



#### WebRTC calling (ADVANCED)

Uses native `RTCPeerConnection` for media (no third-party WebRTC/SIP libraries). **Browser only.**
The following APIs need not be used. They are only useful if you want direct access and control of the underlying webrtc object and session.

```typescript
const webrtc = client.whatsapp.calling.createWebRtcClient(callingConfig);
```

**Outbound call** — the SDK creates the WebRTC offer and calls `connect`. Pass the SDP answer from your webhook handler:

```typescript
const { callId, session } = await webrtc.initiateOutbound({
  to: "919999999999",
});

// Your webhook handler receives the Call Connect event with SDP answer:
await webrtc.completeOutbound(session, {
  sdp_type: "answer",
  sdp: remoteSdpFromWebhook,
});

// Later, end the call:
await webrtc.terminate({ callId });
session.close();
```

**Inbound call** — pass the SDP offer from your webhook handler:

```typescript
const { callId, session } = await webrtc.acceptInbound({
  callId: "wacid.xxx",
  remoteOffer: {
    sdp_type: "offer",
    sdp: offerSdpFromWebhook,
  },
});

// Later:
await webrtc.terminate({ callId });
session.close();
```

**Reject an inbound call:**

```typescript
await webrtc.reject({ callId: "wacid.xxx" });
```

**Low-level session helpers** are also exported if you need manual control over the WebRTC peer connection:

```typescript
import { createInboundAnswerSession } from "chakra-chat-sdk";

const session = await createInboundAnswerSession({
  sdp_type: "offer",
  sdp: offerSdpFromWebhook,
});
```

## Error handling

API errors throw `ChakraChatError`. Request timeouts throw `ChakraChatTimeoutError`.

```typescript
import { ChakraChat, ChakraChatError, ChakraChatTimeoutError } from "chakra-chat-sdk";

try {
  await client.whatsapp.templateMessages.send(params);
} catch (error) {
  if (error instanceof ChakraChatError) {
    console.error(error.statusCode, error.errors, error.responseBody);
  } else if (error instanceof ChakraChatTimeoutError) {
    console.error("Request timed out");
  } else {
    throw error;
  }
}
```



## Request cancellation

Pass an `AbortSignal` to cancel in-flight requests:

```typescript
const controller = new AbortController();

const promise = client.whatsapp.sessionMessages.send(params, {
  signal: controller.signal,
});

controller.abort();
```



## Project structure

```
chakra-chat-sdk/
├── src/
│   ├── index.ts                          # Main entry — ChakraChat class and public exports
│   ├── errors.ts                         # ChakraChatError, ChakraChatTimeoutError
│   ├── http/
│   │   └── client.ts                     # Shared HTTP client (fetch, auth, timeouts)
│   ├── types/
│   │   ├── common.ts                     # ChakraChatConfig, ChakraApiResponse, TemplateMapping
│   │   ├── template-messages.ts          # Template message request/response types
│   │   ├── session-messages.ts           # Session message request/response types
│   │   ├── media.ts                      # Media upload request/response types
│   │   ├── calling.ts                    # Calling API request/response types
│   │   └── index.ts                      # Type re-exports
│   └── resources/
│       ├── index.ts                      # Root resource namespace
│       └── whatsapp/
│           ├── index.ts                  # WhatsAppResource — groups WhatsApp endpoints
│           ├── template-messages.ts      # POST .../send-template-message
│           ├── session-messages.ts       # POST .../messages (Cloud API pass-through)
│           ├── media.ts                  # POST .../upload-public-media
│           ├── calling.ts                # Calling pass-through APIs (settings, permissions, calls)
│           ├── webrtc-session.ts         # Native RTCPeerConnection session helpers
│           └── webrtc-calling-client.ts  # High-level WebRTC calling client
├── package.json
├── tsconfig.json
└── tsup.config.ts
```



### Architecture

The SDK is organized in layers:

1. `ChakraChat` — top-level client; initialized with config and exposes resource namespaces.
2. `resources/` — one class per API domain (e.g. `WhatsAppResource`). Add new domains here as the SDK grows.
3. `resources/whatsapp/` — one class per WhatsApp endpoint group. Add new WhatsApp APIs here.
4. `http/client.ts` — shared HTTP layer handling bearer auth, JSON/form requests, timeouts, and error parsing.
5. `types/` — TypeScript interfaces for config, requests, and responses.

To add a new API:

1. Define types in `src/types/`.
2. Create a resource class in the appropriate `src/resources/` subdirectory.
3. Register it on the parent resource (e.g. `WhatsAppResource` or `Resources`).
4. Re-export new types from `src/types/index.ts`.



## Development

```bash
npm install
npm run build       # compile to dist/ (ESM + CJS + declarations)
npm run dev         # watch mode
npm run typecheck   # TypeScript check without emit
npm run test        # run tests
```



## Requirements

- **Node.js** 18+ (uses native `fetch`)
- **Browsers** with `fetch` and `FormData` support
- **WebRTC calling** requires a browser with native `RTCPeerConnection` and microphone access



## License

ISC