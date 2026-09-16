export const ErrorCode = {
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFIG: "CONFIG",
  INTERNAL: "INTERNAL",
} as const;

export type ChiselErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class ChiselError extends Error {
  readonly code: ChiselErrorCode;

  constructor(code: ChiselErrorCode, message: string) {
    super(message);
    this.name = "ChiselError";
    this.code = code;
  }
}

export function isChiselError(err: unknown): err is ChiselError {
  return err instanceof ChiselError;
}

export function formatUserError(err: unknown): string {
  if (isChiselError(err)) {
    return `[${err.code}] ${err.message}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return String(err);
}

export function errorToJson(err: unknown): { code: string; message: string } {
  if (isChiselError(err)) {
    return { code: err.code, message: err.message };
  }
  if (err instanceof Error) {
    return { code: ErrorCode.INTERNAL, message: err.message };
  }
  return { code: ErrorCode.INTERNAL, message: String(err) };
}
