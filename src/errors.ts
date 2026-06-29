export class ChakraChatError extends Error {
  readonly statusCode: number;
  readonly errors: string[];
  readonly responseBody: unknown;

  constructor(
    message: string,
    options: {
      statusCode: number;
      errors?: string[];
      responseBody?: unknown;
    },
  ) {
    super(message);
    this.name = "ChakraChatError";
    this.statusCode = options.statusCode;
    this.errors = options.errors ?? [];
    this.responseBody = options.responseBody;
  }
}

export class ChakraChatTimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "ChakraChatTimeoutError";
  }
}
