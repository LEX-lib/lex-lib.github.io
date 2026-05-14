# Stack Research — Wallecx (Vaccination Records)

**Domain:** Personal records vault (Phase 1: vaccination records) inside the existing Lexarium SPA
**Researched:** 2026-05-10
**Confidence:** HIGH for items in the locked stack; HIGH for upload/PDF/validation choices; HIGH for the "skip FHIR" call

> **Scope discipline.** Lexarium's stack is locked (Vue 3.5, Vite 8 rolldown, PrimeVue 4 Aura, Pinia 3, Vue Router 4, Tailwind v4, PocketBase 0.26.2, Zod 4.1.5, dayjs, lodash-es, dompurify, vue-sonner). This document does **not** revisit those. It answers four narrow questions raised by the Wallecx milestone:
>
> 1. File uploads (image + PDF) into PocketBase
> 2. PDF preview in the browser
> 3. Form schema validation for vaccination records
> 4. Whether to adopt a medical-record interoperability standard (FHIR)

---

## TL;DR — Prescriptive Picks

| Concern | Pick | Status |
|---------|------|--------|
| File upload to PocketBase | **PocketBase JS SDK `pb.collection().create({...})` with a plain object containing the `File`** — no FormData ceremony, no upload library | Use what's already there (`pocketbase` ^0.26.2) |
| File picker UI | **PrimeVue `FileUpload` in `mode="basic"` with `:auto="false"` and `@select`** (auto-imported) | Use what's already there (`primevue` ^4.3.7) |
| Image down-scaling before upload | **`browser-image-compression` ^2.0.2** (≈12 kB, web-worker capable) | **Add new** |
| PDF preview in browser | **`vue-pdf-embed` ^2.1.4** (single-file PDFs, single page, read-only) | **Add new** |
| Image preview in browser | **`URL.createObjectURL(file)` + `<img>`** for new uploads; **`pb.files.getURL(record, filename)`** for stored files | Use platform |
| Form schema validation | **Zod 4 + `@primevue/forms` `zodResolver`** | Use what's already there (`zod` ^4.1.5, `@primevue/forms` ^4.3.9) |
| Medical-record interop standard (FHIR Immunization) | **DO NOT adopt** — overkill for a single-user personal vault | Explicit non-pick |
| Date handling | **`dayjs`** with `"YYYY-MM-DD"` for PocketBase date fields | Use what's already there |
| Notifications | **`vue-sonner`** `toast.success` / `toast.error` | Use what's already there |

Net new dependencies: **2** (`browser-image-compression`, `vue-pdf-embed`). Everything else is already on disk.

---

## 1. File Upload to PocketBase (image OR PDF)

### Pick: PocketBase SDK plain-object form, **no FormData boilerplate**

The PocketBase JS SDK detects `File` / `Blob` properties on the payload object and converts the body to multipart/form-data automatically. ([js-sdk file uploads](https://github.com/pocketbase/js-sdk?tab=readme-ov-file#file-upload), [docs/files-handling](https://pocketbase.io/docs/files-handling/))

```ts
// src/lib/pocketbase/vaccinationMapper.ts
import { pb } from "@/lib/pocketbase";
import type { AddVaccination } from "@/types/wallecx/vaccinations/types";

export const createVaccination = async (
  payload: AddVaccination,
  attachment?: File | null,
) => {
  return pb.collection("wallecx_vaccinations").create({
    ...payload,
    ...(attachment ? { attachment } : {}),
  });
};

// To clear an existing file on update, send `attachment: null`.
```

**Why this and not a third-party uploader (uppy, filepond, etc.):**

- The PocketBase SDK already handles multipart conversion, progress events (via `requestKey`), and cancellation. No upload library buys us anything for single-file-per-record.
- Adding `uppy`/`filepond` introduces ~80–200 kB and CSS we'd have to re-skin to the navy/amber theme. Not worth it for one-file-per-record.

### File picker UI: PrimeVue `FileUpload` in basic mode

PrimeVue's `FileUpload` is already auto-imported (`PrimeVueResolver`). For Wallecx we want **picker only** (the actual upload is wired into our save handler), so use **`mode="basic"`** with `:auto="false"` and `@select`. Avoid `customUpload` — there is an open 2025 issue (#7664) where files are cleared immediately after the handler fires, breaking previews. ([primefaces/primevue#7664](https://github.com/primefaces/primevue/issues/7664))

```vue
<FileUpload
  mode="basic"
  :auto="false"
  :customUpload="false"
  accept="image/jpeg,image/png,image/webp,application/pdf"
  :maxFileSize="10 * 1024 * 1024"
  chooseLabel="Attach card / certificate"
  @select="onFileSelect"
/>
```

The `@select` event gives us `event.files: File[]`. Hold the `File` in a ref, generate an `objectURL` for preview, and only hand it to the SDK on save. ([primevue.org/fileupload](https://primevue.org/fileupload))

### Image compression before upload

A photo of a vaccination card from a modern phone is 3–8 MB. We do not want to push that through PocketBase per record. Pick **`browser-image-compression` ^2.0.2**.

| Option | Verdict |
|--------|---------|
| **`browser-image-compression` ^2.0.2** | **Pick.** ~12 kB, supports `maxSizeMB`, `maxWidthOrHeight`, web-worker, EXIF preserve. ~890k weekly downloads. Last published 3 years ago — stable, no active issues blocking. ([npm](https://www.npmjs.com/package/browser-image-compression)) |
| `compressorjs` | Heavier (uses `<canvas>` API the same way under the hood), ~30 kB, more features we don't need. Pass. ([npm-compare](https://npm-compare.com/browser-image-compression,compressorjs)) |
| Hand-rolled `<canvas>` resize | Tempting but loses EXIF orientation handling. Not worth saving 12 kB. |

Recommended config for vaccination cards:

```ts
import imageCompression from "browser-image-compression";

const compressed = await imageCompression(file, {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 2000, // keep small text legible
  useWebWorker: true,
  fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
});
```

Skip compression entirely for `application/pdf` and for images already under ~1 MB.

**Confidence:** HIGH (verified package metadata and PocketBase SDK behavior).

---

## 2. PDF Preview in Browser

### Pick: `vue-pdf-embed` ^2.1.4

The use case is read-only "show the user the certificate they uploaded" — single page, no annotations, no editing.

| Option | Verdict |
|--------|---------|
| **`vue-pdf-embed` ^2.1.4** | **Pick.** Vue 3 wrapper over `pdfjs-dist`. Latest 2.1.4 (~April 2026). Composable `useVuePdfEmbed` for caching. Accepts `URL`, `Base64`, `Blob`, or `ArrayBuffer`. ~17k weekly downloads, MIT, actively maintained. ([npm](https://www.npmjs.com/package/vue-pdf-embed), [GitHub](https://github.com/hrynko/vue-pdf-embed)) |
| `@tato30/vue-pdf` ^2.0.2 | Comparable, slightly more feature-rich (page-by-page rendering). Heavier API. ~32k weekly downloads. Choose this only if we later need text layer / search / multi-page navigation — neither is in v1 scope. ([npm](https://www.npmjs.com/package/@tato30/vue-pdf)) |
| `pdfjs-dist` directly | Works, but requires hand-rolled canvas-rendering glue we'd write once and regret. Pass for v1. |
| `<embed>` / `<iframe>` of the PocketBase file URL | "Free" in download size but inconsistent across browsers, no programmatic control over zoom / fit, and breaks under our `frame-src 'none'` CSP. **Pass.** |
| `vue-pdf` (the original `vue-pdf` by various authors) | **Avoid.** The most-cited version hasn't been updated since June 2021. Security/compat risk against current `pdfjs-dist`. ([2025 Vue PDF roundup](https://blog.vue-pdf-viewer.dev/6-open-source-pdf-viewer-and-annotation-libraries-every-vue-developers-should-know-2025)) |

Recommended usage:

```vue
<script setup lang="ts">
import VuePdfEmbed from "vue-pdf-embed";
import "vue-pdf-embed/dist/styles/annotationLayer.css";
import "vue-pdf-embed/dist/styles/textLayer.css";
import { pb } from "@/lib/pocketbase";

const props = defineProps<{ record: VaccinationRecord; filename: string }>();
const fileUrl = computed(() => pb.files.getURL(props.record, props.filename));
</script>

<template>
  <VuePdfEmbed :source="fileUrl" :page="1" />
</template>
```

Lazy-load it (`defineAsyncComponent`) so `pdfjs-dist` (~350 kB gzipped) only ships when a user opens a record with a PDF. This matches the existing Vite manual-chunk strategy in `vite.config.ts`.

**CSP note:** `pdfjs-dist` uses a Web Worker. The current CSP in `index.html` declares `script-src 'self'`, which permits same-origin workers; bundle the worker with Vite (the standard `pdfjs-dist` Vite recipe) and we don't need to relax CSP.

**Confidence:** HIGH.

---

## 3. Form Schema Validation

### Pick: **What's already there** — Zod 4 + `@primevue/forms` `zodResolver`

`Login.vue` already uses this exact pattern. Vaccination records are field-based (vaccine name, date administered, dose number, lot/batch, location) — Zod handles them trivially.

```ts
// inline in <ManageVaccination> or hoisted to a schema module
import { z } from "zod";
import { zodResolver } from "@primevue/forms/resolvers/zod";

const vaccinationSchema = z.object({
  vaccine_name: z.string().trim().min(1, "Vaccine name is required.").max(120),
  date_administered: z.iso.date("Pick the date the dose was given."),
  dose_number: z.coerce.number().int().min(1).max(20).optional(),
  lot_number: z.string().trim().max(64).optional(),
  location: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

const resolver = ref(zodResolver(vaccinationSchema));
```

- Zod 4 has `z.iso.date()` for `YYYY-MM-DD` strings — matches the dayjs format we already write to PocketBase per `CONVENTIONS.md`.
- Drive PrimeVue's `<Form>` `:resolver` prop and short-circuit on `!valid` in `@submit`, exactly as `Login.vue:46-56`.
- Zod schemas can be **reused** as the source of truth for the `AddVaccination` TypeScript type via `z.infer<typeof vaccinationSchema>`, removing the need for hand-written `Add<Entity>` `Omit<>` shims for the *form input*. (Keep the `Vaccinations extends RecordModel` type separate, per existing convention.)

### Alternatives explicitly rejected

| Rejected | Why |
|----------|-----|
| VeeValidate | Overlaps with `@primevue/forms`; would mean maintaining two validation patterns in the same codebase. The convention is already Zod + Primevue Forms. |
| Yup | Older API, smaller ecosystem in 2025/2026, and not already installed. |
| Valibot | Smaller bundle than Zod but loses parity with the existing `Login.vue` pattern; not worth the inconsistency for one mini-app. |
| Hand-rolled refs + manual `if/else` | Anti-pattern; PrimeVue Forms expects a resolver. |

**Confidence:** HIGH (verified against `Login.vue` and PrimeVue Forms docs).

---

## 4. Medical-Record Interoperability (FHIR Immunization)

### Pick: **DO NOT adopt FHIR for v1.** Use a flat PocketBase schema.

The HL7 FHIR Immunization resource is the standard for clinical immunization records ([HL7 FHIR R5 Immunization](https://www.hl7.org/fhir/immunization.html)). It is a poor fit for Wallecx, and adopting it would actively harm the project.

**Why FHIR is wrong for this app:**

1. **No interop partner.** Wallecx is a personal vault stored in PocketBase. There is no clinic, EHR, or government registry on the other end of the wire to consume FHIR. Standardizing for an audience of zero is pure cost.
2. **Schema explosion.** FHIR Immunization has 30+ fields, references to `Patient`, `Practitioner`, `Location`, `Organization`, `Substance`, and a coding system requirement (`vaccineCode` from CVX, SNOMED, ATC, or local code systems). PocketBase doesn't model FHIR references or CodeableConcepts natively — we'd be reinventing them in flat columns and JSON blobs.
3. **No mature client-side SDK that's worth pulling in.** Libraries like `fhir.js` and `@types/fhir` exist but assume a FHIR server. We don't have one. The `fhir-kit-client` and similar are for talking to remote FHIR endpoints.
4. **Personal vault ≠ clinical record.** The user explicitly wants "save and view my vaccination history" — not a clinically-validated record they'll exchange with providers. The card scan in `attachment` *is* the authoritative artifact.

**What to do instead:** model a flat, generalizable PocketBase collection that captures the five fields from `PROJECT.md` and leaves room for vault-wide extension later:

```
wallecx_vaccinations
  user            relation -> users (required, indexed)
  vaccine_name    text (required, max 120)
  date_administered  date (required, indexed)
  dose_number     number (optional)
  lot_number      text (optional, max 64)
  location        text (optional, max 200)
  notes           text (optional, max 2000)
  attachment      file (optional; allow image/* + application/pdf, ~10 MB cap, single file)
  created / updated  auto
```

If, in a future phase, a real interop need appears (e.g., importing a government immunization registry export), we can write a one-shot mapper from FHIR JSON to this schema. We will not be worse off for having stayed flat in v1.

**Confidence:** HIGH. The negative claim "FHIR is overkill here" is well-supported by the FHIR spec's own complexity and the absence of any interop partner in the project scope.

---

## 5. Other Concerns Worth Flagging

### File-type and size enforcement (defense in depth)

Client-side checks (PrimeVue `accept`, `maxFileSize`) are UX, not security. **Configure the PocketBase file field server-side** with:

- `mimeTypes`: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
- `maxSize`: 10 MB (10485760 bytes)
- `maxSelect`: 1
- `thumbs`: e.g., `200x200`, `800x0` — PocketBase generates thumbnails on the fly; use them in the list view to avoid downloading full-size images per row. ([files-handling](https://pocketbase.io/docs/files-handling/))

### Listing & thumbnails

`pb.files.getURL(record, filename, { thumb: "200x200" })` → use in the list view. Full-size only on detail view. This is a free win the SDK already provides.

### CSP impact

`index.html` currently allows `img-src 'self' data: https: blob:`. Adding image previews via `URL.createObjectURL(file)` (which yields `blob:`) and PocketBase-served images (HTTPS) is already covered. **No CSP changes needed for image preview.** PDF rendering via `pdfjs-dist` runs in a same-origin worker — also covered.

### Sanitization

A `notes` field is plain text only. **Do not** wire Quill into Wallecx v1 — it adds 80+ kB and forces us to keep DOMPurify on the read path. If we ever want rich notes later, follow the LexTrack pattern (`v-html="sanitize(...)"`).

### Telemetry

Per `PROJECT.md` constraints: **no telemetry on record contents.** `@vercel/speed-insights` only measures navigation/RUM and doesn't capture form data — keep it as-is.

---

## Installation

```bash
# Two new runtime deps. Versions verified May 2026.
npm install browser-image-compression@^2.0.2 vue-pdf-embed@^2.1.4
```

That's it. Everything else (`pocketbase`, `primevue`, `zod`, `@primevue/forms`, `dayjs`, `vue-sonner`, `dompurify`) is already installed.

---

## Alternatives Considered

| Recommended | Alternative | When to pick the alternative |
|-------------|-------------|------------------------------|
| `vue-pdf-embed` ^2.1.4 | `@tato30/vue-pdf` ^2.0.2 | If a future phase needs text-search inside PDFs or page-by-page navigation. |
| `browser-image-compression` ^2.0.2 | `compressorjs` | If we need precise quality-curve tuning per record type. Unlikely. |
| PrimeVue `FileUpload` (`mode="basic"`) | `<input type="file">` styled with Tailwind | If PrimeVue's `FileUpload` keeps shipping bugs around `customUpload` / clear behavior. The basic-mode `@select` path we recommend dodges those bugs. |
| Flat PocketBase schema | FHIR-compatible JSON column | Only if we adopt a real interop scenario (export to a clinic, import from a registry). Not in v1. |
| Zod + `@primevue/forms` | VeeValidate + Yup | Don't. Stick with the established Lexarium convention. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `vue-pdf` (the unscoped, original package) | Last meaningful update June 2021. Drifts on `pdfjs-dist` security updates. | `vue-pdf-embed` |
| `<iframe src="...pdf">` | Inconsistent rendering, blocked by current CSP `frame-src 'none'`, no zoom control. | `vue-pdf-embed` |
| `customUpload` mode of PrimeVue `FileUpload` | Open issue #7664: files cleared before previews can render. | `mode="basic"` + `:auto="false"` + `@select` |
| FHIR Immunization resource modeling | No interop partner; 10× the schema for zero benefit; PocketBase isn't a FHIR server. | Flat `wallecx_vaccinations` collection. |
| `quill` for the notes field | Already installed but adds DOMPurify dependency on read; v1 has no rich-text need. | `<Textarea>` (PrimeVue, already auto-imported). |
| `uppy` / `filepond` | Heavyweight uploaders for a one-file-per-record use case. | PocketBase SDK directly. |
| Hand-rolled FormData | Unnecessary; SDK handles it from a plain object. | `pb.collection().create({ ...fields, attachment: file })` |
| `dayjs.toISOString().split("T")[0]` | Anti-pattern called out in `CONVENTIONS.md`. | `dayjs(date).format("YYYY-MM-DD")` |

---

## Stack Patterns by Variant

**If the user uploads a phone photo (image/jpeg, image/png, image/webp):**
- Run `browser-image-compression` with `maxSizeMB: 1.5`, `maxWidthOrHeight: 2000`.
- Preview via `URL.createObjectURL(compressedFile)` until save.
- Persist the compressed `File` to PocketBase.
- On read, render via `<img :src="pb.files.getURL(record, filename, { thumb: '800x0' })">` for detail; `thumb: '200x200'` for list.

**If the user uploads a PDF (application/pdf):**
- **Skip** compression.
- Preview via lazy-loaded `<VuePdfEmbed :source="objectUrl" :page="1" />`.
- Persist the original `File` to PocketBase.
- On read, render via lazy-loaded `<VuePdfEmbed :source="pb.files.getURL(record, filename)" :page="1" />`.

**If the file fails MIME or size validation:**
- `toast.error("Only JPG, PNG, WebP or PDF up to 10 MB.")`
- Clear the FileUpload via its options handle (`event.options.clear()`).

**If we later want to generalize to more vault record types:**
- Keep `wallecx_vaccinations` as-is.
- Add new flat collections (`wallecx_identity_documents`, `wallecx_prescriptions`) — do **not** retrofit a polymorphic `wallecx_records` until proven needed. PocketBase cost of one collection per type is negligible.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `vue-pdf-embed` ^2.1.4 | `vue` ^3.5, `pdfjs-dist` (bundled transitively) | 2.x line is Vue-3-only. Stay on the v2 line. |
| `browser-image-compression` ^2.0.2 | Browsers with `OffscreenCanvas` (all modern), Web Workers | Last release 3 years ago but stable; widely deployed. |
| `pocketbase` ^0.26.2 | PocketBase server 0.26.x | Already on this. File-field rules (mime, maxSize, thumbs) are server-side config. |
| `zod` ^4.1.5 | `@primevue/forms` ^4.3.9 | Already paired in `Login.vue`. `zodResolver` import path is `@primevue/forms/resolvers/zod`. |
| `primevue` ^4.3.7 | `FileUpload` `@select` event | Stable. `customUpload` has open issues — avoid. |

---

## Sources

- [PocketBase docs — Files handling](https://pocketbase.io/docs/files-handling/) — HIGH (official). FormData-or-plain-object upload semantics, file-field options (mimeTypes, maxSize, thumbs).
- [pocketbase/js-sdk README — File upload](https://github.com/pocketbase/js-sdk?tab=readme-ov-file#file-upload) — HIGH. SDK auto-converts payloads with `File`/`Blob` to multipart.
- [DeepWiki — PocketBase JS SDK File Uploads](https://deepwiki.com/pocketbase/js-sdk/6.4-file-uploads) — MEDIUM. Confirmation of the `+` field-name modifier for multi-file fields (not used in v1).
- [PrimeVue FileUpload docs](https://primevue.org/fileupload) — HIGH. `mode="basic"`, `:auto`, `@select`, `accept`, `maxFileSize` props and event payloads.
- [PrimeVue issue #7664 — customUpload clears files](https://github.com/primefaces/primevue/issues/7664) — HIGH. Justifies our "use basic mode + @select, avoid customUpload" recommendation.
- [vue-pdf-embed on npm (v2.1.4)](https://www.npmjs.com/package/vue-pdf-embed) — HIGH. Latest version, Vue 3 only, supported sources.
- [vue-pdf-embed GitHub](https://github.com/hrynko/vue-pdf-embed) — HIGH. Active maintenance, MIT.
- [@tato30/vue-pdf on npm (v2.0.2)](https://www.npmjs.com/package/@tato30/vue-pdf) — HIGH. Considered alternative, page-level API.
- [browser-image-compression on npm (v2.0.2)](https://www.npmjs.com/package/browser-image-compression) — HIGH. Latest version, options surface, web-worker support.
- [npm-compare: browser-image-compression vs compressorjs](https://npm-compare.com/browser-image-compression,compressorjs) — MEDIUM. Trade-off rationale.
- [HL7 FHIR R5 Immunization](https://www.hl7.org/fhir/immunization.html) — HIGH (authoritative). Justifies "overkill for personal vault" call by the spec's own breadth.
- [HL7 FHIR Immunization (R6 ballot, build)](https://build.fhir.org/immunization.html) — HIGH. Forward-looking confirmation that the resource is growing, not shrinking.
- [Vue PDF Viewer — Top 6 PDF Libraries for Vue (2025)](https://blog.vue-pdf-viewer.dev/6-open-source-pdf-viewer-and-annotation-libraries-every-vue-developers-should-know-2025) — MEDIUM (vendor blog but useful overview that flags `vue-pdf` as stale).
- Internal: `.planning/codebase/STACK.md`, `.planning/codebase/INTEGRATIONS.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/PROJECT.md`, `package.json` — HIGH (authoritative for what's already on disk).

---

*Stack research for: Wallecx vaccination records (Lexarium mini-app, Phase 1)*
*Researched: 2026-05-10*

---
---

# Stack Addendum — Wallecx v2.0 Membership Cards

**Domain:** Barcode/QR rendering + fullscreen scan overlay for the membership cards feature
**Researched:** 2026-05-13
**Confidence:** HIGH — all library versions verified via npm registry; bundle sizes measured directly from installed dist files; Vite 8 / Rolldown CJS interop behaviour verified against Rolldown docs and vite.config.ts

> **Scope discipline.** This addendum answers only what is NEW for v2.0. The locked stack (Vue 3.5, Vite 8 rolldown, PrimeVue 4 Aura, Pinia 3, Vue Router 4, Tailwind v4, PocketBase, Zod 4, dayjs, lodash-es, dompurify, vue-sonner, browser-image-compression, vue-pdf-embed) is not re-litigated here.
>
> Three new concerns for v2.0:
> 1. QR code rendering
> 2. Linear barcode rendering (Code128, EAN-13, Code39)
> 3. Fullscreen scan overlay

---

## v2.0 TL;DR — Prescriptive Picks

| Concern | Pick | Net-new install? |
|---------|------|-----------------|
| QR code rendering | **`qrcode.vue` ^3.9.1** — SVG or canvas, zero runtime deps, bundled QR algorithm | Yes — `npm install qrcode.vue` |
| Linear barcode rendering (Code128, EAN-13, Code39) | **`jsbarcode` ^3.12.3** + thin Vue wrapper composable (hand-rolled, ~30 lines) | Yes — `npm install jsbarcode` |
| Vue component wrapper for JsBarcode | **`@chenfengyuan/vue-barcode` ^2.0.2** OR the hand-rolled composable pattern below | Optional — see trade-off |
| Fullscreen scan overlay | **`useFullscreen` from `@vueuse/core` ^13.9.0** (already hoisted in `node_modules` as a dep of `@vueuse/motion`) | No new install needed |

Net-new runtime dependencies for v2.0: **2** (`qrcode.vue`, `jsbarcode`). `@vueuse/core` is already on disk.

---

## 1. QR Code Rendering

### Pick: `qrcode.vue` ^3.9.1

**Why this library:**

- Self-contained: the QR encoding algorithm is bundled inside the package. Zero runtime peer dependencies. The ESM build (`qrcode.vue.esm.js`) is 66 KB raw / ~17 KB gzip. This is a one-install, done.
- Actively maintained: v3.9.1 published 2026-05-12 (one day before this research). The project sees regular patch releases in 2026.
- Vue 3 native: full `<script setup>` + TypeScript. Exports `Level`, `RenderAs`, `GradientType`, `ImageSettings` type helpers.
- Dual render target: `render-as="svg"` (preferred for membership cards — scales perfectly on any screen DPI) or `render-as="canvas"`. SVG is also serialisable to a data-URI for export if needed later.
- 181 downstream npm packages depend on it; far more battle-tested than the alternatives.

**Verified package.json exports** (correct Vite/Rolldown resolution):

```json
{
  "module": "./dist/qrcode.vue.esm.js",
  "exports": {
    ".": {
      "import": "./dist/qrcode.vue.esm.js",
      "require": "./dist/qrcode.vue.cjs.js"
    }
  }
}
```

Vite 8 resolves `"import"` first — this is a clean ESM path. No Rolldown CJS interop workaround needed.

**Integration pattern:**

```vue
<script setup lang="ts">
import QrcodeVue from "qrcode.vue";
import type { Level, RenderAs } from "qrcode.vue";

const props = defineProps<{
  value: string;
  size?: number;
}>();

const level: Level = "M";
const renderAs: RenderAs = "svg";
</script>

<template>
  <QrcodeVue
    :value="props.value"
    :size="props.size ?? 200"
    :level="level"
    :render-as="renderAs"
    foreground="#002244"
  />
</template>
```

`foreground="#002244"` applies the Lexarium navy colour to the QR modules. Background defaults to white — suitable for the card overlay.

**Bundle contribution:** ~17 KB gzip added to the chunk that first imports `qrcode.vue`. Because this is only used inside the Memberships feature, wrap the card detail component in `defineAsyncComponent` and it will land in a lazy chunk, not the initial bundle.

**Alternatives rejected:**

| Option | Why not |
|--------|---------|
| `qrcode-vue3` | Last published 2 years ago, only 10 downstream dependents. Unmaintained. |
| `useQRCode` from `@vueuse/integrations` | Requires `qrcode` as a separate peer dep (adds another install). Returns a data-URI string rendered into `<img>`, no colour/gradient/logo overlay support. Use only if we need a composable that returns a raw string. |
| `@fengyuanchen/vue-qrcode` | Fork of the same idea; redirects to `qrcode.vue` in its own docs. No reason to use the fork. |
| Raw `qrcode` npm package | Works but requires hand-rolling the Vue wrapper. qrcode.vue already does this correctly. |

---

## 2. Linear Barcode Rendering (Code128, EAN-13, Code39)

### Pick: `jsbarcode` ^3.12.3 — render to `<svg>` via a thin composable

**Why JsBarcode and not a Vue-specific wrapper:**

JsBarcode (3.12.3, published 2025-10-xx) is the de-facto standard for browser-side linear barcode generation. It has zero peer dependencies, supports all required formats (CODE128, EAN13, EAN8, CODE39, and 10+ others), and renders to `<svg>`, `<canvas>`, or `<img>`. The dist file (`JsBarcode.all.min.js`) is 66 KB raw / ~11 KB gzip.

The Vue wrapper library `@chenfengyuan/vue-barcode` is a 1.5 KB shim that calls `JsBarcode(el, value, options)` on mount and watch. It is so thin that writing the same 30 lines inline as a composable eliminates one package and avoids the wrapper's limitation (it uses the Options API `watch` + `mounted` pattern, not Composition API).

**Recommended implementation — hand-rolled composable:**

```ts
// src/composables/useBarcode.ts
import { onMounted, watch, type Ref } from "vue";
import JsBarcode from "jsbarcode";

export interface BarcodeOptions {
  format: "CODE128" | "EAN13" | "EAN8" | "CODE39";
  displayValue?: boolean;
  lineColor?: string;
  background?: string;
  width?: number;
  height?: number;
  margin?: number;
  fontSize?: number;
}

export function useBarcode(
  svgRef: Ref<SVGElement | null>,
  value: Ref<string>,
  options: BarcodeOptions,
) {
  const render = () => {
    if (svgRef.value && value.value) {
      JsBarcode(svgRef.value, value.value, {
        format: options.format,
        displayValue: options.displayValue ?? true,
        lineColor: options.lineColor ?? "#002244",
        background: options.background ?? "#ffffff",
        width: options.width ?? 2,
        height: options.height ?? 80,
        margin: options.margin ?? 10,
        fontSize: options.fontSize ?? 14,
      });
    }
  };

  onMounted(render);
  watch([value], render);
}
```

**Usage in a component:**

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useBarcode } from "@/composables/useBarcode";

const props = defineProps<{
  value: string;
  format: "CODE128" | "EAN13" | "EAN8" | "CODE39";
}>();

const svgEl = ref<SVGElement | null>(null);
useBarcode(svgEl, () => props.value, { format: props.format });
</script>

<template>
  <svg ref="svgEl" />
</template>
```

**Rolldown / Vite 8 CJS interop note:**

JsBarcode's `package.json` has `"main": "./bin/JsBarcode.js"` only — no `"module"` or `"exports"` field. This is a CJS-only package. Vite's dep optimiser (powered by Rolldown in Vite 8) will pre-bundle it to ESM during `vite dev` automatically. Rolldown handles CJS modules natively without `@rollup/plugin-commonjs`. No `vite.config.ts` change is required, but if the dev server shows an interop warning, add:

```ts
// vite.config.ts — only add if warnings appear
optimizeDeps: {
  include: ["jsbarcode"],
}
```

Testing in the existing project's Vite 8 / Rolldown setup is recommended as a first build step of the implementation phase (not a blocker — the interop path is well-travelled for CJS libs).

**Alternative: `@chenfengyuan/vue-barcode` ^2.0.2**

The `@chenfengyuan` wrapper is 1.5 KB ESM and imports JsBarcode as a peer dep. It is a valid option if a drop-in `<VueBarcode value="..." :options="..." tag="svg" />` template component is preferred over the composable. The trade-off: it uses Options API internally and exposes only `value` + `options` as props (no typed `format` prop at the component level — format lives inside the `options` object). The composable approach above gives typed props and Composition API patterns consistent with the rest of the codebase.

If the roadmap assigns this to a phase with tight time constraints, use `@chenfengyuan/vue-barcode` and skip writing the composable. Either path installs `jsbarcode` as the underlying engine.

**Alternatives rejected:**

| Option | Why not |
|--------|---------|
| `bwip-js` ^4.10.1 | Supports 100+ barcode types including QR — but it is 960 KB on disk (the full PostScript transpilation). For three formats (Code128, EAN-13, Code39) this is grotesque overkill. JsBarcode at ~11 KB gzip covers everything we need. |
| `vue-barcode` (lindell's package) | Wraps JsBarcode the same way as `@chenfengyuan/vue-barcode` but with fewer TypeScript definitions and older maintenance cadence. |
| Hand-rolled SVG barcode drawing | Not a real option for Code128/EAN-13 — the encoding algorithms alone are non-trivial. Use JsBarcode. |

---

## 3. Fullscreen Scan Overlay

### Pick: `useFullscreen` from `@vueuse/core` ^13.9.0 — already installed

**Key discovery: no new package needed.**

`@vueuse/motion` ^3.0.3 is already a direct dependency in `package.json`. `@vueuse/core` ^13.x is a peer dependency of `@vueuse/motion` and is already hoisted into `node_modules/@vueuse/core` (version 13.9.0 confirmed). Importing `useFullscreen` from `@vueuse/core` is free.

**Why `useFullscreen` over alternatives:**

- `useFullscreen` wraps the native browser Fullscreen API (`requestFullscreen` / `exitFullscreen`) reactively. It exposes `{ isFullscreen, enter, exit, toggle }` — exactly what a "tap card to go fullscreen" UX needs.
- No third-party modal or overlay library is needed: the card component itself is placed in fullscreen, not a wrapper dialog. This approach lets the barcode/QR SVG fill the entire screen without fighting PrimeVue Dialog's max-height or scroll constraints.
- Automatic cleanup on unmount via the `autoExit` option (set to `true` for the scan view).

**Integration pattern:**

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useFullscreen } from "@vueuse/core";

const cardEl = ref<HTMLElement | null>(null);
const { isFullscreen, toggle } = useFullscreen(cardEl, { autoExit: true });
</script>

<template>
  <div
    ref="cardEl"
    class="membership-card"
    :class="{ 'is-fullscreen': isFullscreen }"
    @click="toggle"
  >
    <!-- barcode or QR code component -->
    <!-- card number fallback text -->
    <button v-if="isFullscreen" class="exit-btn" @click.stop="toggle">
      Done
    </button>
  </div>
</template>
```

In fullscreen mode apply Tailwind utilities (`bg-white flex items-center justify-center`) to centre the barcode/QR on a clean background for scanner readability.

**iOS Safari limitation (MEDIUM confidence — not personally tested):**

iOS Safari only supports fullscreen on `<video>` elements. For all other elements, `requestFullscreen()` is a no-op. The practical mitigation: detect `!document.fullscreenEnabled` and fall back to a CSS-driven "fake fullscreen" via fixed positioning (`position: fixed; inset: 0; z-index: 9999`). Most loyalty card scanners are operated by Android/desktop devices, but the fallback should be implemented to avoid a broken tap on iPhone.

```ts
// Fallback detection
const supportsFullscreen = document.fullscreenEnabled ?? false;
// If false, toggle a `isFakeFullscreen` ref and apply fixed-positioning CSS class instead
```

**Alternative: PrimeVue Dialog with `maximizable`**

PrimeVue's `<Dialog maximizable>` prop enables a maximize button that expands the dialog to fill the viewport. This is simpler than `useFullscreen` (no API calls, no iOS fallback needed) but has a different UX: the Dialog chrome (header bar, close button) remains visible in maximized state, which wastes vertical space for a barcode display.

Recommendation: use `useFullscreen` + CSS fallback for the primary path. If the implementation phase hits iOS issues and the iOS fallback feels fragile, switch to a `<Dialog maximizable :style="{ width: '100vw' }" position="center">` approach — it is a one-component change.

---

## Bundle Impact Summary

| Library | Raw dist | Gzip | Install path |
|---------|----------|------|--------------|
| `qrcode.vue` ^3.9.1 | 67 KB (ESM) | ~17 KB | `npm install qrcode.vue` |
| `jsbarcode` ^3.12.3 | 66 KB (all formats, minified) | ~11 KB | `npm install jsbarcode` |
| `@chenfengyuan/vue-barcode` ^2.0.2 | 1.5 KB (ESM shim only) | < 1 KB | Optional — `npm install @chenfengyuan/vue-barcode` if composable path is skipped |
| `@vueuse/core` `useFullscreen` | Already on disk (13.9.0 hoisted) | ~0 KB marginal | No install |

Total marginal gzip impact for v2.0 barcode feature: **~28 KB** (qrcode.vue + jsbarcode). Both should land in a lazy async chunk for the Memberships sub-app — the initial Lexarium bundle is unaffected.

The existing `vite.config.ts` code-splitting groups do not cover `qrcode.vue` or `jsbarcode`. Add a `memberships` group if profiling shows them contributing to a shared vendor chunk:

```ts
// vite.config.ts rolldownOptions.output.codeSplitting.groups
{ name: "memberships", test: /\/qrcode\.vue|\/jsbarcode/, priority: 25 }
```

---

## Alternatives Considered (v2.0)

| Category | Recommended | Alternative | Why not |
|----------|-------------|-------------|---------|
| QR rendering | `qrcode.vue` ^3.9.1 | `useQRCode` (@vueuse/integrations) | Requires separate `qrcode` peer dep; only returns data-URI string; no colour/gradient support |
| QR rendering | `qrcode.vue` ^3.9.1 | `qrcode-vue3` ^1.7.1 | Unmaintained (last release 2 years ago) |
| Linear barcode | `jsbarcode` ^3.12.3 | `bwip-js` ^4.10.1 | 960 KB on disk for 100+ formats we don't need; grotesque for 3 formats |
| Linear barcode | `jsbarcode` ^3.12.3 | Hand-rolled SVG | Code128/EAN-13 encoding algorithms are non-trivial; not worth it |
| Fullscreen | `useFullscreen` (@vueuse/core) | PrimeVue Dialog `maximizable` | Dialog chrome wastes screen space in a barcode-scan context; fullscreen API gives full-bleed view |
| Fullscreen | `useFullscreen` (@vueuse/core) | Native `element.requestFullscreen()` | `useFullscreen` adds reactive state + cleanup; no reason to not use it when it's already installed |

---

## What NOT to Add for v2.0

| Do not add | Why | Use instead |
|-----------|-----|-------------|
| `bwip-js` | 960 KB for 100+ formats; 3 formats needed | `jsbarcode` |
| `vue-qrcode-reader` / `vue3-barcode-qrcode-reader` | Scanning the physical world via camera — not in v2.0 scope (we render, not scan) | Not needed |
| `html2canvas` / screenshot-to-share | Not in v2.0 scope | Not needed |
| A CSS framework overlay library (e.g., `vue-loading-overlay`) | Overkill; `useFullscreen` + Tailwind fixed-position is sufficient | useFullscreen + CSS |
| Any new icon set beyond `iconify-icon` | Already covers all needed icons | `iconify-icon` (existing) |

---

## Installation (v2.0 only)

```bash
# Two new runtime deps for v2.0. Versions verified 2026-05-13.
npm install qrcode.vue@^3.9.1 jsbarcode@^3.12.3

# Optional — only if skipping the hand-rolled composable approach:
# npm install @chenfengyuan/vue-barcode@^2.0.2
```

`@vueuse/core` is already on disk. No additional install required.

---

## Sources (v2.0 Addendum)

- [qrcode.vue on GitHub (scopewu/qrcode.vue)](https://github.com/scopewu/qrcode.vue) — HIGH. Version 3.9.1, active maintenance (published 2026-05-12), TypeScript types, Vue 3 native, SVG + canvas render modes.
- [JsBarcode on GitHub (lindell/JsBarcode)](https://github.com/lindell/JsBarcode) — HIGH. Version 3.12.3, zero dependencies, all required formats (CODE128, EAN-13, CODE39).
- [@chenfengyuan/vue-barcode on GitHub](https://github.com/fengyuanchen/vue-barcode) — HIGH. Version 2.0.2, Vue 3 only, JsBarcode peer dep confirmed.
- [useFullscreen — VueUse docs](https://vueuse.org/core/usefullscreen/) — HIGH. API: `{ isFullscreen, enter, exit, toggle }`, `autoExit` option, iOS Safari video-only limitation documented.
- [@vueuse/motion package.json `dependencies`](https://www.npmjs.com/package/@vueuse/motion) — HIGH. `@vueuse/core: ^13.0.0` is a direct dep of @vueuse/motion; confirmed hoisted to version 13.9.0 in this project's node_modules.
- [PrimeVue Dialog docs](https://primevue.org/dialog/) — HIGH. `maximizable` prop confirmed as the alternative fullscreen approach.
- [Rolldown — Bundling CJS](https://rolldown.rs/in-depth/bundling-cjs) — HIGH. CJS module interop handled natively by Rolldown; no `@rollup/plugin-commonjs` needed; `optimizeDeps.include` available as escape hatch.
- [Vite 8 migration guide](https://vite.dev/guide/migration) — HIGH. Vite 8 uses Rolldown for both dev pre-bundling and production build; CJS is handled automatically.
- Direct npm registry: `npm show qrcode.vue version` → 3.9.1; `npm show jsbarcode version` → 3.12.3; `npm show @chenfengyuan/vue-barcode version` → 2.0.2 — HIGH (live registry).
- Dist file size measurements: installed packages in temp directory, measured with `wc -c` and `gzip -c | wc -c` — HIGH (direct measurement).

---

*Stack addendum for: Wallecx v2.0 Membership Cards (barcode/QR rendering + fullscreen scan overlay)*
*Researched: 2026-05-13*

---
---

# Stack Addendum — Wallecx v3.0 PWA + Mobile-Responsive

**Domain:** PWA installability, offline app shell, standalone mode, mobile-responsive layouts
**Researched:** 2026-05-14
**Confidence:** HIGH for vite-plugin-pwa version and Vite 8 compatibility; HIGH for Workbox strategy; HIGH for icon requirements; MEDIUM for iOS-specific behaviour (documented limitations, not personally tested on device)

> **Scope discipline.** This addendum answers only what is NEW for the PWA + mobile milestone. The locked stack (Vue 3.5, Vite 8 rolldown, PrimeVue 4 Aura, Pinia 3, Vue Router 4, Tailwind v4, PocketBase, Zod 4, dayjs, vue-sonner, qrcode.vue, jsbarcode) is not re-litigated here.
>
> Four new concerns for v3.0:
> 1. Service worker and PWA manifest generation (vite-plugin-pwa)
> 2. Workbox caching strategy for a SPA with PocketBase backend
> 3. Icon generation (sizes, maskable, iOS touch icon)
> 4. Mobile-responsive layout with Tailwind v4 and iOS safe area insets

---

## v3.0 TL;DR — Prescriptive Picks

| Concern | Pick | Net-new install? |
|---------|------|-----------------|
| PWA plugin | **`vite-plugin-pwa` ^1.3.0** — devDependency | Yes — `npm install -D vite-plugin-pwa` |
| Service worker strategy | **`generateSW`** (default) with `registerType: 'prompt'` | Config only — no extra package |
| Workbox caching | **`NetworkFirst`** for PocketBase API; **`CacheFirst`** for static assets (handled automatically by precache) | Config only |
| Icon generation | **`@vite-pwa/assets-generator`** CLI (devDependency) — one SVG in, all sizes out | Yes — `npm install -D @vite-pwa/assets-generator` |
| Mobile viewport / safe areas | **Tailwind v4 responsive utilities** + `viewport-fit=cover` in `index.html` + `env(safe-area-inset-*)` CSS | Config only — no new package |
| Vercel PWA headers | **`vercel.json`** with `Cache-Control: no-cache` on `sw.js` and `Content-Type: application/manifest+json` on manifest | New file |

Net-new dev dependencies for v3.0: **2** (`vite-plugin-pwa`, `@vite-pwa/assets-generator`). Zero new runtime dependencies.

---

## 1. vite-plugin-pwa — Version and Vite 8 Compatibility

### Pick: `vite-plugin-pwa` ^1.3.0 (devDependency)

**Version confirmed:** v1.3.0 released 2026-05-05. This is the first release that explicitly adds Vite 8 to its peer dependency range. Earlier versions (up to v1.2.0, released 2025-11-27) issued a peer dependency warning against Vite 8 but functioned correctly.

**Vite 8 / Rolldown compatibility — CONFIRMED COMPATIBLE.**

vite-plugin-pwa operates entirely as a Vite plugin using the standard Rollup plugin API (hook-based). Rolldown in Vite 8 implements the same hook interface. The plugin does not use any Rollup internals or CJS-specific bundling paths that Rolldown would reject. GitHub issue #918 (opened 2026-03-12, closed with PR #924) confirmed that the only change needed was updating the peer dependency declaration — the plugin code itself required no modification.

No `vite.config.ts` workarounds are needed for Rolldown compatibility with vite-plugin-pwa.

**Why devDependency, not dependency:**

vite-plugin-pwa generates a service worker and manifest at build time. Nothing from the package is imported into or shipped as part of the app bundle — it is purely a build tool.

**Alternatives rejected:**

| Option | Why not |
|--------|---------|
| `workbox-build` directly | vite-plugin-pwa wraps workbox-build and handles Vite asset hashing, manifest injection, and SW registration automatically. Rolling our own would reproduce the plugin without the Vite integration. |
| `@vite-pwa/nuxt` | Nuxt-specific — not applicable to a plain Vue 3 SPA. |
| `vite-plugin-manifest-icons` | Handles icons only, not service worker. Not a replacement. |

---

## 2. Service Worker Strategy

### Pick: `generateSW` with `registerType: 'prompt'`

**`generateSW` vs `injectManifest`:**

`generateSW` is the correct choice here. It generates a complete service worker using Workbox without writing any custom SW code. `injectManifest` is for teams who need custom SW logic (background sync, push notifications, custom fetch handlers). Wallecx's PWA goal is installability and offline app shell — `generateSW` handles this with zero custom code.

**`registerType: 'prompt'` vs `'autoUpdate'`:**

Use `'prompt'`, not `'autoUpdate'`. Reasoning:

- `autoUpdate` forces `skipWaiting: true` and silently reloads all open tabs when a new SW version is detected. If a user is mid-flow (e.g., typing in a ManageMembership dialog), they lose their work without warning.
- `'prompt'` surfaces an update notification (via vue-sonner — already installed) that the user dismisses at their own pace. This is the recommended approach when the app handles forms.
- The update notification is a simple toast with a "Reload" button. Wire it to `useRegisterSW`'s `needRefresh` reactive ref.

**`navigateFallback` for SPA routing:**

Vue Router 4 uses HTML5 history mode. The service worker must serve `index.html` for all navigation requests so the router handles the path, not the SW. Set `navigateFallback: 'index.html'` in the workbox config. Use `navigateFallbackDenylist` to exclude API calls from this fallback:

```ts
navigateFallbackDenylist: [/^\/api/, /\/_pocketbase/, /\/pb_/]
```

**Full recommended `vite.config.ts` plugin config:**

```ts
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'prompt',
  // generateSW is the default strategies value — explicit for clarity
  strategies: 'generateSW',
  // Include all assets Vite outputs so they are precached
  includeAssets: ['favicon.ico', 'branding_logo.svg', 'apple-touch-icon-180x180.png'],
  manifest: {
    name: 'Wallecx — Personal Records Vault',
    short_name: 'Wallecx',
    description: 'Your vaccination records and membership cards, always with you.',
    theme_color: '#002244',   // Lexarium navy
    background_color: '#002244',
    display: 'standalone',
    start_url: '/projects/wallecx',
    scope: '/',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: 'pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    navigateFallback: 'index.html',
    navigateFallbackDenylist: [/^\/api/, /\/_pb/, /\/pb_/],
    // Precache all Vite output assets (JS chunks, CSS, fonts) automatically
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        // PocketBase API — network-first; fall back to cache if offline
        urlPattern: ({ url }) =>
          url.origin === 'https://your-pocketbase-host.example.com',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'pocketbase-api',
          networkTimeoutSeconds: 5,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 day
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
  devOptions: {
    // Enable SW in dev to test installability locally
    enabled: false,  // flip to true when actively developing/testing PWA
    type: 'module',
  },
})
```

**Why `NetworkFirst` for PocketBase, not `StaleWhileRevalidate`:**

`NetworkFirst` ensures the user always sees fresh data when online — critical for a personal records vault where mutations happen on the backend. `StaleWhileRevalidate` would show stale vaccination records while silently fetching updates, which is confusing. `NetworkFirst` with a 5-second timeout falls back gracefully to cache when offline, which is the "offline app shell" goal.

**Why NOT `CacheFirst` for PocketBase API:**

`CacheFirst` for API responses means the user always sees stale data first, even when online. Incorrect for mutable backend data.

---

## 3. Icon Requirements

### Minimum set for Chrome + iOS installability

The PWA minimum requirements (verified against vite-pwa-org.netlify.app/guide/pwa-minimal-requirements) are:

| Icon | Size | Purpose | Required by |
|------|------|---------|------------|
| `pwa-192x192.png` | 192×192 | `any` | Chrome (Android) install prompt |
| `pwa-512x512.png` | 512×512 | `any` | Chrome splash screen |
| `pwa-maskable-512x512.png` | 512×512 | `maskable` | Android adaptive icon system |
| `apple-touch-icon-180x180.png` | 180×180 | (linked in `<head>`) | iOS "Add to Home Screen" |
| `favicon.ico` | multi-size | (already exists) | Browser tab |

**Do NOT set purpose `"any maskable"` on a single icon.** This is explicitly discouraged — icons with `purpose: "any maskable"` look incorrect on some platforms because the safe zone padding is applied universally, creating excessive whitespace on platforms that expect edge-to-edge icons.

### Maskable icon safe zone

The maskable icon must keep all significant visual content within the inner 80% circle of the 512×512 canvas. The outer 10% on each side may be cropped by the OS. Design the brand mark to occupy the centre 80% and fill the remaining background with the `theme_color` (#002244 navy).

### Icon generation — `@vite-pwa/assets-generator`

Use the official assets generator from the vite-pwa ecosystem. It reads a single SVG source and outputs all required sizes using `sharp` (no Puppeteer, no browser launched).

```bash
# Install as devDependency
npm install -D @vite-pwa/assets-generator

# Generate all icons from the existing branding_logo.svg
# Output lands in public/ by default
npx pwa-assets-generator --preset minimal-2023 public/branding_logo.svg
```

The `minimal-2023` preset generates: `favicon.ico` (48×48), `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png` (any), `pwa-512x512.png` (maskable), `apple-touch-icon-180x180.png`.

**Caveat:** The existing `branding_logo.svg` was designed as a wide-format logo for the nav bar — it may not look good centred in a square icon canvas. The PWA implementation phase must verify this and may need a square-safe version of the mark. This is a design task, not a code task, but it is a blocker for publishable icons.

**Alternative: browser-based generators**

Progressier's maskable icon editor (progressier.com/maskable-icons-editor) allows safe zone preview in the browser. Use it to verify the generated maskable icon before committing. Not a build dependency — a one-off verification tool.

---

## 4. Mobile-Responsive Layout

### Tailwind v4 — no framework changes needed

Tailwind v4 is already installed and mobile-first by default. Unprefixed utilities apply at all breakpoints; `sm:`, `md:`, `lg:` add overrides for wider viewports. This is the correct approach for Wallecx mobile layouts.

**Default breakpoints (Tailwind v4, confirmed):**

| Prefix | Minimum width |
|--------|--------------|
| (none) | 0px — mobile base |
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

No custom breakpoints are needed for Wallecx. The existing `my-app-dark` dark mode class and Lexarium design tokens are unaffected by PWA addition.

**Container queries:** Tailwind v4 introduces `@container` / `@sm:` etc. for component-level responsiveness. These are available if a component needs to adapt to its parent width rather than the viewport. Not required for initial mobile work, but a useful tool for the card grid layout.

### iOS standalone mode — viewport and safe areas

When installed as a PWA on iOS in standalone mode, the status bar and home indicator consume screen space that the browser would normally handle. Two changes are required in `index.html`:

**1. Update the viewport meta tag:**

```html
<!-- Current -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Required for PWA safe areas -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

Without `viewport-fit=cover`, all `env(safe-area-inset-*)` values resolve to `0px` and Safari letterboxes content on notched/Dynamic Island devices.

**2. Add iOS-specific PWA meta tags:**

```html
<!-- iOS standalone mode — do not show Safari chrome when launched from home screen -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<!-- Status bar colour — black-translucent lets content extend under the status bar -->
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<!-- iOS home screen title -->
<meta name="apple-mobile-web-app-title" content="Wallecx" />
<!-- iOS touch icon — must be linked, not only in manifest -->
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
```

**3. Apply safe area insets in CSS where content edges the screen:**

```css
/* In src/assets/main.css or a global Tailwind @layer */
.wallecx-shell {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

Or via Tailwind utility classes if custom properties are registered:

```html
<!-- Tailwind v4 arbitrary property approach -->
<div class="pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
```

**iOS PWA known limitations (2026):**

| Limitation | Impact on Wallecx | Mitigation |
|------------|-------------------|------------|
| No automatic install prompt | User must manually tap Share → Add to Home Screen | Add visible "Install App" hint in UI |
| 50 MB storage cap for cached assets | Low risk — Wallecx static assets are well under 10 MB | Monitor with Chrome DevTools storage panel |
| 7-day cache expiry if app not opened | App shell goes stale; user must be online to refresh | Use `NetworkFirst` so any online visit refreshes the cache |
| No Background Sync API | Cannot queue writes made offline for later sync | Scope: offline = read-only; all writes require network (acceptable for a personal vault) |
| EU users (iOS 17.4+) get Safari tab mode | Push and badge APIs unavailable in EU | No push notifications planned for v3.0 |
| `100vh` includes Safari bottom bar | Layout shift when address bar hides | Use `dvh` (dynamic viewport height) instead of `vh`: `h-dvh` Tailwind utility |

---

## 5. Vercel Deployment — Required `vercel.json`

There is no existing `vercel.json` in the project root. Vercel currently handles SPA routing via its automatic rewrite detection for Vite apps, but PWA requires explicit header control.

Create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/manifest.webmanifest",
      "headers": [
        { "key": "Content-Type", "value": "application/manifest+json" },
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

**Why `Service-Worker-Allowed: /`:** The service worker is served from the root (`/sw.js`) and needs to control the entire origin scope. This header grants that permission. Without it, SW registration fails with a scope error.

**Why the rewrite excludes `/api/`:** Prevents the SPA fallback from intercepting any server-side API routes. Vercel's own edge functions or rewrites for the PocketBase proxy (if any) should be added before the catch-all.

---

## 6. Integration Points with Existing `vite.config.ts`

The existing config uses `rolldownOptions.output.codeSplitting.groups`. vite-plugin-pwa sits alongside the existing plugins and does not interfere with Rolldown code splitting. Add it to the `plugins` array after the existing plugins:

```ts
// vite.config.ts — complete updated plugins array
import { VitePWA } from 'vite-plugin-pwa';

plugins: [
  vue({ ... }),                        // existing
  ...(dev ? [vueDevTools()] : []),     // existing
  Components({ resolvers: [...] }),    // existing
  tailwindcss(),                       // existing
  VitePWA({ ... }),                    // ADD HERE — after tailwindcss()
],
```

The service worker registration script (`registerSW.js`) is injected into `index.html` automatically by the plugin at build time — no manual `<script>` tag is needed in `index.html`.

**TypeScript types:** vite-plugin-pwa ships its own types. The `useRegisterSW` composable (for the update prompt) is imported from the virtual module `virtual:pwa-register/vue`:

```ts
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { needRefresh, updateServiceWorker } = useRegisterSW();
// needRefresh: Ref<boolean> — true when a new SW version is waiting
// updateServiceWorker: () => Promise<void> — call to activate the new SW
```

Add `"virtual:pwa-register/vue"` to `tsconfig.json`'s `compilerOptions.types` if TypeScript complains about the virtual module. vite-plugin-pwa includes the necessary `.d.ts` stubs.

---

## 7. What NOT to Add for v3.0 PWA

| Do not add | Why | Use instead |
|-----------|-----|-------------|
| `workbox-window` separately | vite-plugin-pwa bundles and configures workbox-window automatically | vite-plugin-pwa's `useRegisterSW` |
| `offline-plugin` (webpack-era) | Webpack-only; incompatible with Vite | vite-plugin-pwa |
| `@nuxtjs/pwa` | Nuxt-only | vite-plugin-pwa |
| `pwa-asset-generator` (elegantapp) | Older tool using Puppeteer; heavier setup; superseded by `@vite-pwa/assets-generator` which uses sharp directly | `@vite-pwa/assets-generator` |
| `workbox-strategies` as a runtime dependency | The generated SW already bundles the required strategies; no runtime import needed in app code | workbox via `generateSW` (build-time only) |
| Push notification infrastructure | Out of scope for v3.0; iOS EU limitations make this unreliable anyway | Not needed |
| Background sync for offline writes | PocketBase mutations require auth token freshness checks — safe offline writes need significant architecture that exceeds v3.0 scope | Not needed; offline = read-only |
| `vue-pwa-install` / `@khmyznikov/pwa-install` | Third-party install prompt UIs; overkill for a personal app. A simple vueSonner toast with "Add to home screen" instructions is sufficient. | vue-sonner (existing) + custom prompt |
| A separate `manifest.json` file | vite-plugin-pwa generates and injects the manifest automatically. Maintaining a static file alongside the generated one causes conflicts. | vite-plugin-pwa manifest config |
| `<meta name="theme-color">` hardcoded in `index.html` | vite-plugin-pwa injects the theme-color meta tag from the manifest config. Adding it manually creates a duplicate. | Let the plugin handle it |

---

## Installation (v3.0 only)

```bash
# Two new devDependencies for v3.0. Versions verified 2026-05-14.
npm install -D vite-plugin-pwa@^1.3.0 @vite-pwa/assets-generator

# Generate icons — run once after choosing the source SVG
npx pwa-assets-generator --preset minimal-2023 public/branding_logo.svg
```

Zero new runtime dependencies. The service worker and manifest are build artifacts, not shipped npm packages.

---

## Version Compatibility (v3.0)

| Package | Vite 8 compatible? | Notes |
|---------|-------------------|-------|
| `vite-plugin-pwa` ^1.3.0 | YES — confirmed in v1.3.0 release notes and issue #918 | Install as devDependency |
| `@vite-pwa/assets-generator` | Build-time CLI only; Vite version irrelevant | Uses `sharp` for image processing |
| Workbox (bundled by vite-plugin-pwa) | Workbox 7.x — Node 16+, matches `engines.node` in package.json | No separate Workbox install |
| `useRegisterSW` virtual module | Works with Vue 3.5 + `<script setup>` | Import from `virtual:pwa-register/vue` |

---

## Sources (v3.0 Addendum)

- [vite-plugin-pwa GitHub releases](https://github.com/vite-pwa/vite-plugin-pwa/releases) — HIGH. v1.3.0 released 2026-05-05; "Add vite 8 peer dependency support" confirmed in release notes.
- [vite-plugin-pwa issue #918 — Vite 8 support](https://github.com/vite-pwa/vite-plugin-pwa/issues/918) — HIGH. Confirms peer dep was the only change; plugin functioned with Vite 8 prior to official support.
- [Vite PWA official docs — Guide](https://vite-pwa-org.netlify.app/guide/) — HIGH. `registerType`, `generateSW`, minimal config.
- [Vite PWA official docs — Minimal requirements](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements) — HIGH. Icon sizes (192, 512), manifest fields, HTTPS, manifest MIME type requirements.
- [Vite PWA official docs — generateSW workbox options](https://vite-pwa-org.netlify.app/workbox/generate-sw) — HIGH. `runtimeCaching`, `navigateFallback`, `navigateFallbackDenylist`, `globPatterns`.
- [Vite PWA official docs — Assets Generator](https://vite-pwa-org.netlify.app/assets-generator/) — HIGH. `@vite-pwa/assets-generator` CLI, `minimal-2023` preset, output sizes.
- [Vite PWA official docs — Vercel deployment](https://vite-pwa-org.netlify.app/deployment/vercel) — HIGH. Required `vercel.json` headers for `sw.js`, manifest, and static assets.
- [Vite PWA — autoUpdate vs prompt-for-update](https://vite-pwa-org.netlify.app/guide/auto-update.html) — HIGH. autoUpdate risks data loss on forms; prompt is safer.
- [MDN — Web App Manifest icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/icons) — HIGH. `purpose` values: `any`, `maskable`, and why `"any maskable"` is discouraged.
- [web.dev — Add a web app manifest](https://web.dev/articles/add-manifest) — HIGH. Chrome minimum icon requirements, manifest fields.
- [MagicBell — PWA iOS Limitations 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — MEDIUM. iOS 50 MB storage cap, 7-day cache expiry, no Background Sync, EU standalone mode loss in iOS 17.4+.
- [MDN — Define app icons](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Define_app_icons) — HIGH. Maskable safe zone = inner 80% circle.
- [Tailwind CSS v4 — Responsive design](https://tailwindcss.com/docs/responsive-design) — HIGH. Mobile-first breakpoints, `dvh` unit, container queries.
- [web.dev — App design (safe areas)](https://web.dev/learn/pwa/app-design) — HIGH. `viewport-fit=cover`, `env(safe-area-inset-*)` usage in standalone PWA mode.
- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8) — HIGH. Rolldown unified bundler, plugin API compatibility with Rollup plugins.

---

*Stack addendum for: Wallecx v3.0 PWA + Mobile-Responsive*
*Researched: 2026-05-14*
