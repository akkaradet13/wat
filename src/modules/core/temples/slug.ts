/** ("วัดนิคมกิตติยาราม", "อุบลราชธานี") -> "นิคมกิตติยาราม-อุบลราชธานี" */
export function makeSlug(name: string, province: string): string {
  const clean = (s: string) =>
    s
      .trim()
      .replace(/^วัด\s*/, "")
      .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  return [clean(name), clean(province)].filter(Boolean).join("-");
}

/** First of base, base-2, base-3 ... that is not taken. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}
