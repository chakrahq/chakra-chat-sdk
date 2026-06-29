import { HttpClient } from "./http/client.js";
import { Resources } from "./resources/index.js";
import type { ChakraChatConfig } from "./types/common.js";

/**
 * Main entry point for the Chakra Chat SDK.
 *
 * @example
 * ```ts
 * import { ChakraChat } from "chakra-chat-sdk";
 *
 * const client = new ChakraChat({ accessToken: process.env.CHAKRA_ACCESS_TOKEN! });
 *
 * await client.whatsapp.templateMessages.send("plugin-id", "919901258433", {
 *   whatsappPhoneNumberId: "775966265503012",
 *   templateName: "hello_world",
 * });
 * ```
 */
export class ChakraChat {
  private readonly http: HttpClient;
  readonly whatsapp: Resources["whatsapp"];

  constructor(config: ChakraChatConfig) {
    this.http = new HttpClient(config);
    const resources = new Resources(this.http);
    this.whatsapp = resources.whatsapp;
  }
}

export { ChakraChatError, ChakraChatTimeoutError } from "./errors.js";
export { HttpClient } from "./http/client.js";
export * from "./types/index.js";
