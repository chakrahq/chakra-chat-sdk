/**
 * Configuration for initializing the Chakra Chat SDK.
 */
export interface ChakraChatConfig {
  /**
   * Bearer access token used to authenticate API requests.
   */
  accessToken: string;

  /**
   * Base URL for the Chakra API.
   * @default "https://api.chakrahq.com"
   */
  baseUrl?: string;

  /**
   * Custom fetch implementation. Defaults to the global `fetch`.
   * Useful for testing or environments that polyfill fetch.
   */
  fetch?: typeof fetch;

  /**
   * Request timeout in milliseconds.
   * @default 30000
   */
  timeoutMs?: number;
}

/**
 * Standard Chakra API response envelope.
 */
export interface ChakraApiResponse<T> {
  _data: T;
  _errors?: string[];
}

/**
 * Template parameter mapping used in template message requests.
 */
export interface TemplateMapping {
  /** Property name — for template `{{1}}`, use `"1"`. */
  schemaPropertyName: string;
  /** Value mapped to this property. */
  schemaPropertyValue: string;
}

/**
 * Options passed to the underlying HTTP client for individual requests.
 */
export interface RequestOptions {
  signal?: AbortSignal;
}
