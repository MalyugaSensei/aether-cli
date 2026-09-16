export type ChiselErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "ALREADY_EXISTS"
  | "CONFIG"
  | "INTERNAL";

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
    return { code: "INTERNAL", message: err.message };
  }
  return { code: "INTERNAL", message: String(err) };
}
