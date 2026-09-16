import type { IncomingMessage } from "node:http";

export async function readJson<T = unknown>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
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
  constructor(message: string) {
    super(message);
    this.name = "JsonBodyError";
  }
}
