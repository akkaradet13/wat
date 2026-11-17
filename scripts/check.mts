// Self-check for pure logic. Usage: npm run check
import assert from "node:assert/strict";
import { distanceM } from "../src/modules/alms/geo.ts";
import { makeSlug, uniqueSlug } from "../src/modules/core/temples/slug.ts";

assert.equal(makeSlug("วัดนิคมกิตติยาราม", "อุบลราชธานี"), "นิคมกิตติยาราม-อุบลราชธานี");
assert.equal(makeSlug("  วัด พระแก้ว (กรุงเทพ) ", "กรุงเทพมหานคร"), "พระแก้ว-กรุงเทพ-กรุงเทพมหานคร");
assert.equal(makeSlug("Wat Pho!", "Bangkok"), "wat-pho-bangkok");
assert.equal(uniqueSlug("a", new Set()), "a");
assert.equal(uniqueSlug("a", new Set(["a", "a-2"])), "a-3");
// ~111.2 km per degree of latitude; 0.0027 deg ~ 300 m
assert.ok(Math.abs(distanceM({ lat: 15, lng: 104 }, { lat: 16, lng: 104 }) - 111_195) < 50);
assert.ok(Math.abs(distanceM({ lat: 15.26, lng: 104.89 }, { lat: 15.2627, lng: 104.89 }) - 300) < 2);
assert.equal(distanceM({ lat: 15, lng: 104 }, { lat: 15, lng: 104 }), 0);
console.log("check: ok");
