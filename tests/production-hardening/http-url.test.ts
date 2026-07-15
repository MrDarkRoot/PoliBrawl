import assert from "node:assert/strict";
import test from "node:test";

import { httpUrlSchema, isSafeHttpUrl } from "../../src/features/shared/schemas/http-url";

test("safe URL validation accepts http and https", () => {
  assert.equal(isSafeHttpUrl("https://example.com"), true);
  assert.equal(isSafeHttpUrl("http://example.com/path"), true);
  assert.equal(httpUrlSchema.safeParse("https://example.com").success, true);
});

test("safe URL validation rejects unsafe schemes", () => {
  assert.equal(isSafeHttpUrl("javascript:alert(1)"), false);
  assert.equal(isSafeHttpUrl("data:text/html,hi"), false);
  assert.equal(isSafeHttpUrl("file:///tmp/test.txt"), false);
  assert.equal(httpUrlSchema.safeParse("javascript:alert(1)").success, false);
});
