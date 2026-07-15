import assert from "node:assert/strict";
import test from "node:test";

import { validateEditorialField } from "../../src/server/polibrawl/services/editorial/editorial-quality-validator";

test("editorial validation rejects placeholder copy", () => {
  const issues = validateEditorialField({
    label: "Platform summary",
    value: "Official survival overview for this platform. Review the official evidence before proceeding.",
    required: true,
    minLength: 20,
  });

  assert.match(issues.join(" "), /placeholder or internal-only copy/i);
});

test("editorial validation rejects unsupported guarantee language", () => {
  const issues = validateEditorialField({
    label: "Resolution summary",
    value: "This route will recover your money after review.",
    required: true,
    minLength: 20,
  });

  assert.match(issues.join(" "), /unsupported certainty or guarantee language/i);
});
