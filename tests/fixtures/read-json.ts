import type { IncomingMessage } from "node:http";

export async function readJson<T = unknown>(req: IncomingMessage, maxBytes = 1048576): Promise<T> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    size += buf.length;
    if (size > maxBytes) {
      throw new JsonBodyError("Request body too large", 413);
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    throw new JsonBodyError("Request body is empty");
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new JsonBodyError("Invalid JSON body");
  }
}

export class JsonBodyError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "JsonBodyError";
    this.status = status;
  }
}
