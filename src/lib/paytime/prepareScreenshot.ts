import { compressToWebP } from "@/lib/wallecx/compressToWebP";

/**
 * Cap on the file the user may pick. Deliberately much larger than
 * MaxScreenshotBytes (what PocketBase will store): the point of compressing
 * is to accept a full-size phone photo and shrink it, so gating the input at
 * the stored limit would reject files we could easily have handled.
 */
export const MaxSourceScreenshotBytes = 15 * 1024 * 1024;

export interface PreparedScreenshot {
  file: File;
  /** False when the original was returned unchanged. */
  isCompressed: boolean;
}

/**
 * Shrinks a picked proof-of-payment image before upload.
 *
 * compressToWebP re-encodes via canvas, which drops EXIF (including GPS) as a
 * side effect — browser-image-compression only copies EXIF across when
 * preserveExif is set AND the output stays JPEG, and we force image/webp.
 *
 * Falls back to the original file on any failure. The common cause is a HEIC
 * picked outside Safari, which most browsers cannot decode; an oversized
 * proof that PocketBase may reject is still better than dropping the user's
 * file on the floor silently.
 */
export async function prepareScreenshot(
  file: File,
): Promise<PreparedScreenshot> {
  try {
    const compressed = await compressToWebP(file);
    // Re-encoding a small or already-optimised image can make it bigger.
    return compressed.size < file.size
      ? { file: compressed, isCompressed: true }
      : { file, isCompressed: false };
  } catch (error) {
    console.warn("prepareScreenshot: falling back to original file", error);
    return { file, isCompressed: false };
  }
}
