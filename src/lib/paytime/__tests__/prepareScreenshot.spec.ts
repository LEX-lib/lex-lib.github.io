import { beforeEach, describe, expect, it, vi } from "vitest";

const compressToWebP = vi.fn();
vi.mock("@/lib/wallecx/compressToWebP", () => ({
  compressToWebP: (file: File) => compressToWebP(file),
}));

const { prepareScreenshot } = await import("../prepareScreenshot");

const fileOf = (name: string, type: string, size: number) => {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

beforeEach(() => {
  compressToWebP.mockReset();
});

describe("prepareScreenshot", () => {
  it("returns the compressed file when it is smaller", async () => {
    const source = fileOf("proof.jpg", "image/jpeg", 4_000_000);
    const smaller = fileOf("proof.webp", "image/webp", 300_000);
    compressToWebP.mockResolvedValue(smaller);

    const result = await prepareScreenshot(source);
    expect(result.file).toBe(smaller);
    expect(result.isCompressed).toBe(true);
  });

  // Re-encoding an already-small image can inflate it.
  it("keeps the original when compression does not shrink it", async () => {
    const source = fileOf("tiny.png", "image/png", 5_000);
    compressToWebP.mockResolvedValue(fileOf("tiny.webp", "image/webp", 9_000));

    const result = await prepareScreenshot(source);
    expect(result.file).toBe(source);
    expect(result.isCompressed).toBe(false);
  });

  // Typically a HEIC the browser cannot decode. Must not lose the file.
  it("falls back to the original when compression throws", async () => {
    const source = fileOf("photo.heic", "image/heic", 6_000_000);
    compressToWebP.mockRejectedValue(new Error("decode failed"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await prepareScreenshot(source);
    expect(result.file).toBe(source);
    expect(result.isCompressed).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
