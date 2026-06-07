import { describe, expect, it } from "vitest";
import { getProfileEmoji, hasUserAvatar } from "./userAvatar";

describe("hasUserAvatar", () => {
  it("rejects empty and placeholder URLs", () => {
    expect(hasUserAvatar(null)).toBe(false);
    expect(hasUserAvatar("")).toBe(false);
    expect(hasUserAvatar("https://via.placeholder.com/150")).toBe(false);
  });

  it("accepts real avatar URLs", () => {
    expect(hasUserAvatar("https://api.example.com/media/avatars/a.png")).toBe(true);
  });
});

describe("getProfileEmoji", () => {
  it("returns an emoji string", () => {
    expect(getProfileEmoji("Jane")).toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it("is stable for the same seed", () => {
    expect(getProfileEmoji("john@example.com")).toBe(getProfileEmoji("john@example.com"));
  });
});
