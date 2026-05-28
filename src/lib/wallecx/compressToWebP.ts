import imageCompression from 'browser-image-compression'

/**
 * Compresses an image File to WebP using browser-image-compression.
 *
 * Preconditions enforced by CALLERS, not by this helper:
 *   - File must already be EXIF-stripped (canvas re-encode in each Manage* dialog's onFileSelect).
 *   - PDFs MUST NOT be passed here — callers short-circuit application/pdf earlier in the flow.
 *
 * Options ({ maxSizeMB: 1.5, maxWidthOrHeight: 2048, useWebWorker: true }) are byte-identical
 * to the previous inline calls in ManageExpense.vue / ManageMembership.vue / ManageVaccination.vue
 * (Phase 36 D-36-09: PRESERVE THESE). The new option is fileType: 'image/webp' (D-36-10).
 */
export async function compressToWebP(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: 'image/webp',
  })
}
