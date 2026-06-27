import { describe, it, expect } from "vitest";
import { checkinSessions, checkinLabel, CHECKIN_LEVELS } from "./checkin";

describe("checkinSessions", () => {
  it("bersih is always a true zero", () => {
    expect(checkinSessions("bersih", 6)).toBe(0);
    expect(checkinSessions("bersih", 20)).toBe(0);
  });
  it("biasa equals the baseline", () => {
    expect(checkinSessions("biasa", 6)).toBe(6);
    expect(checkinSessions("biasa", 13)).toBe(13);
  });
  it("ringan is below, banyak is above baseline", () => {
    expect(checkinSessions("ringan", 6)).toBe(4); // round(3.6)
    expect(checkinSessions("banyak", 6)).toBe(8); // round(8.4)
  });
  it("never returns below 1 for non-zero levels even at tiny baselines", () => {
    expect(checkinSessions("ringan", 1)).toBe(1);
    expect(checkinSessions("ringan", 0)).toBe(1);
    expect(checkinSessions("banyak", 1)).toBe(1);
  });
});

describe("checkinLabel + table", () => {
  it("has exactly four ordered levels", () => {
    expect(CHECKIN_LEVELS.map((l) => l.key)).toEqual([
      "bersih",
      "ringan",
      "biasa",
      "banyak",
    ]);
  });
  it("labels resolve", () => {
    expect(checkinLabel("biasa")).toBe("Biasa");
    expect(checkinLabel("banyak")).toBe("Banyak");
  });
});
