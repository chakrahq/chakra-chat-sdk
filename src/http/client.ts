import { ChakraChatError, ChakraChatTimeoutError } from "../errors.js";
import type {
  ChakraApiResponse,
  ChakraChatConfig,
  RequestOptions,
} from "../types/common.js";

const DEFAULT_BASE_URL = "https://api.chakrahq.com";
const DEFAULT_TIMEOUT_MS = 30_000;

export class HttpClient {
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(config: ChakraChatConfig) {
    if (!config.accessToken?.trim()) {
      throw new Error("accessToken is required");
    }

    this.accessToken = config.accessToken;
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = config.fetch ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    if (typeof this.fetchImpl !== "function") {
      throw new Error(
        "fetch is not available. Provide a custom fetch implementation via config.fetch.",
      );
    }
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>("GET", path, undefined, options);
  }

  async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }

  async postFormData<T>(
    path: string,
    formData: FormData,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>("POST", path, formData, options, true);
  }

  buildPath(...segments: string[]): string {
    return segments.map((segment) => encodeURIComponent(segment)).join("/");
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions,
    isFormData = false,
  ): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    if (options?.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener("abort", () => controller.abort(), {
          once: true,
        });
      }
    }

    const signal = controller.signal;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      Accept: "application/json",
    };

    if (!isFormData && body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await this.fetchImpl(url, {
        method,
        headers,
        body:
          body === undefined
            ? undefined
            : isFormData
              ? (body as FormData)
              : JSON.stringify(body),
        signal,
      });

      const responseBody = await this.parseResponseBody(response);

      if (!response.ok) {
        throw this.createError(response.status, responseBody);
      }

      return responseBody as T;
    } catch (error) {
      if (error instanceof ChakraChatError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        if (options?.signal?.aborted) {
          throw error;
        }
        throw new ChakraChatTimeoutError(
          `Request timed out after ${this.timeoutMs}ms`,
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private createError(statusCode: number, responseBody: unknown): ChakraChatError {
    const envelope = responseBody as ChakraApiResponse<unknown> | undefined;
    const errors = Array.isArray(envelope?._errors) ? envelope._errors : [];
    const message =
      errors[0] ??
      (typeof responseBody === "string" ? responseBody : `Request failed with status ${statusCode}`);

    return new ChakraChatError(message, {
      statusCode,
      errors,
      responseBody,
    });
  }
}
