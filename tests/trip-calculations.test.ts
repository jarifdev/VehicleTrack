import { describe, expect, it } from "vitest";
import { calculateUsed, isValidReturn } from "@/lib/trip-calculations";

describe("trip reconciliation", () => {
  it("calculates used quantity", () => {
    expect(calculateUsed(10, 4)).toBe(6);
  });

  it("accepts a zero return", () => {
    expect(isValidReturn(10, 0)).toBe(true);
  });

  it("rejects returning more than was taken", () => {
    expect(isValidReturn(10, 11)).toBe(false);
  });
});
