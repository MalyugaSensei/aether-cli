import { describe, expect, it } from "vitest";
import { Readable } from "node:stream";
import type { IncomingMessage } from "node:http";
import { JsonBodyError, readJson } from "../fixtures/read-json.js";

function reqWithBody(body: string): IncomingMessage {
  const stream = Readable.from([body]) as IncomingMessage;
  stream.method = "POST";
  stream.url = "/";
  return stream;
}

describe("http helpers (generated app semantics)", () => {
  it("R-router-03: empty body throws JsonBodyError", async () => {
    const req = reqWithBody("");
    await expect(readJson(req)).rejects.toBeInstanceOf(JsonBodyError);
  });

  it("R-crud-02: invalid JSON throws JsonBodyError", async () => {
    const req = reqWithBody("{");
    await expect(readJson(req)).rejects.toBeInstanceOf(JsonBodyError);
  });
});
