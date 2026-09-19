import { describe, expect, it } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { EventEmitter } from "node:events";
import { createRouter, type Route } from "../fixtures/router.js";

function mockReq(method: string, url: string): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.method = method;
  req.url = url;
  return req;
}

function mockRes(): ServerResponse & { body: string; status: number } {
  const res = new EventEmitter() as ServerResponse & { body: string; status: number };
  res.statusCode = 200;
  res.body = "";
  res.setHeader = () => res;
  res.end = (chunk?: unknown) => {
    if (chunk) res.body += String(chunk);
    res.emit("finish");
    return res;
  };
  return res;
}

describe("router", () => {
  it("R-router-01: extracts and decodes path params", async () => {
    const routes: Route[] = [
      {
        method: "GET",
        path: "/users/:id",
        handler: (_req, res, params) => {
          res.statusCode = 200;
          res.end(JSON.stringify(params));
        },
      },
    ];
    const handler = createRouter(routes);
    const req = mockReq("GET", "/users/hello%20world");
    const res = mockRes();
    await handler(req, res, {});
    expect(JSON.parse(res.body)).toEqual({ id: "hello world" });
  });

  it("R-router-02: returns 404 when no route matches", async () => {
    const handler = createRouter([]);
    const req = mockReq("GET", "/nope");
    const res = mockRes();
    await handler(req, res, {});
    expect(res.statusCode).toBe(404);
  });

  it("R-router-01: normalizes trailing slash", async () => {
    let hit = false;
    const handler = createRouter([
      {
        method: "GET",
        path: "/users",
        handler: () => {
          hit = true;
        },
      },
    ]);
    const req = mockReq("GET", "/users/");
    const res = mockRes();
    await handler(req, res, {});
    expect(hit).toBe(true);
  });

  it("static segment wins over param route at the same level (registration order)", async () => {
    const handler = createRouter([
      {
        method: "GET",
        path: "/users/count",
        handler: (_req, res) => {
          res.end("count");
        },
      },
      {
        method: "GET",
        path: "/users/:id",
        handler: (_req, res) => {
          res.end("id");
        },
      },
    ]);
    const res1 = mockRes();
    await handler(mockReq("GET", "/users/count"), res1, {});
    expect(res1.body).toBe("count");
    const res2 = mockRes();
    await handler(mockReq("GET", "/users/abc"), res2, {});
    expect(res2.body).toBe("id");
  });
});
