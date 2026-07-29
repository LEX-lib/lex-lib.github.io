import imageCompression from 'browser-image-compression'

/**
 * Compresses an image File to WebP using browser-image-compression.
 *
 * Shared across features — do not add caller-specific behaviour here.
 *
 * Caller contract:
 *   - Images only. Passing a PDF (or anything the browser cannot decode as an
 *     image) rejects, so callers must short-circuit those first.
 *   - Rejects rather than degrading when decoding fails. HEIC is the common
 *     case: only Safari decodes it, so callers that accept HEIC need a
 *     fallback (see lib/paytime/prepareScreenshot.ts).
 *   - Output can be LARGER than the input for small or already-optimised
 *     images; compare sizes if that matters.
 *
 * EXIF, including GPS, is dropped as a side effect: browser-image-compression
 * only copies EXIF across when `preserveExif` is set (default false) AND the
 * output stays JPEG, and this forces image/webp. So no separate strip pass is
 * needed — wallecx's Manage* dialogs do one anyway, which is redundant.
 *
 * The option values are load-bearing and were tuned deliberately; don't
 * change them without checking every caller's storage limits.
 */
export async function compressToWebP(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: 'image/webp',
  })
  // PocketBase serves files by the stored filename's extension; if we keep the
  // original `.jpg`/`.png`/etc on a WebP-content file, PocketBase's thumb
  // generator returns 404 (extension/content mismatch). Rename so the stored
  // filename matches the actual MIME — this also lets downstream consumers use
  // a simple filename.endsWith('.webp') check to decide thumb-vs-full URL.
  const webpName = compressed.name.replace(/\.[^.]+$/, '.webp')
  // Already .webp (input was a .webp file, or browser-image-compression already renamed it
  // for us) — no rename needed; return the compressed File directly and skip the allocation.
  return webpName === compressed.name
    ? compressed
    : new File([compressed], webpName, { type: 'image/webp' })
}
