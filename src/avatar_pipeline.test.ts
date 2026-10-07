import assert from "node:assert/strict";
import { riskDecision } from "./avatar_pipeline.ts";

assert.equal(riskDecision("acct-42", "pay-1", "img-1").status, "approved");
assert.equal(riskDecision("review-acct", "pay-2", "img-2").status, "review");
console.log("risk decision test passed");
