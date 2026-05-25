import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";
import app from "../app.js";

test("auth login is rate limited and API responses set security headers", async () => {
  const server = app.listen(0);

  try {
    await once(server, "listening");
    const address = server.address() as AddressInfo;
    const loginUrl = `http://127.0.0.1:${address.port}/api/auth/login`;

    for (let requestCount = 0; requestCount < 30; requestCount += 1) {
      const response = await fetch(loginUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      });

      assert.equal(response.status, 400);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    }

    const limitedResponse = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({}),
    });

    assert.equal(limitedResponse.status, 429);
    assert.equal(limitedResponse.headers.get("x-frame-options"), "DENY");
  } finally {
    server.close();
    await once(server, "close");
  }
});
