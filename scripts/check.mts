// Self-check for pure logic. Usage: npm run check
import assert from "node:assert/strict";
import { makeSlug, uniqueSlug } from "../src/modules/core/temples/slug.ts";

assert.equal(makeSlug("วัดนิคมกิตติยาราม", "อุบลราชธานี"), "นิคมกิตติยาราม-อุบลราชธานี");
assert.equal(makeSlug("  วัด พระแก้ว (กรุงเทพ) ", "กรุงเทพมหานคร"), "พระแก้ว-กรุงเทพ-กรุงเทพมหานคร");
assert.equal(makeSlug("Wat Pho!", "Bangkok"), "wat-pho-bangkok");
assert.equal(uniqueSlug("a", new Set()), "a");
assert.equal(uniqueSlug("a", new Set(["a", "a-2"])), "a-3");
console.log("check: ok");
