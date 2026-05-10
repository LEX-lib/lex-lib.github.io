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
