import { describe, expect, it } from "bun:test";
import { initials } from "./initials";

const EMAIL = "chau@example.test";

describe("initials", () => {
  it("takes first and last for a two-word name", () => {
    expect(initials("Alex Kim", EMAIL)).toBe("AK");
  });

  it("takes one letter for a single-word name, not two", () => {
    expect(initials("Alex", EMAIL)).toBe("A");
  });

  it("skips middle names", () => {
    expect(initials("Ada Byron Lovelace", EMAIL)).toBe("AL");
  });

  it("ignores surrounding and repeated whitespace", () => {
    expect(initials("  Ada   Byron  Lovelace  ", EMAIL)).toBe("AL");
  });

  it("falls back to the email's local part when the name is empty", () => {
    expect(initials("", EMAIL)).toBe("C");
    expect(initials("   ", EMAIL)).toBe("C");
  });

  it("returns nothing usable as an empty string, so the caller can render an icon", () => {
    expect(initials("", "")).toBe("");
    expect(initials("   ", "   ")).toBe("");
  });

  it("keeps a multi-code-unit grapheme whole instead of splitting the pair", () => {
    const result = initials("👩‍🚀 Nova", EMAIL);
    expect(result).toBe("👩‍🚀N");
    expect(result).not.toContain("�");
  });

  it("keeps a combining mark attached", () => {
    const decomposed = "José Ramos";
    expect(initials(decomposed, EMAIL)).toBe("JR");
  });

  it("handles CJK, which has no case to change", () => {
    expect(initials("田中 太郎", EMAIL)).toBe("田太");
    expect(initials("田中太郎", EMAIL)).toBe("田");
  });

  it("handles a right-to-left script", () => {
    expect(initials("محمد علي", EMAIL)).toBe("مع");
  });

  it("uppercases a lowercase name", () => {
    expect(initials("alex kim", EMAIL)).toBe("AK");
  });
});
