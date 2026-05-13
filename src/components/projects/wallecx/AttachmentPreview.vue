<script setup lang="ts">
import { defineAsyncComponent, computed, ref } from "vue";
import { pb } from "@/lib/pocketbase";
import type { RecordModel } from 'pocketbase'
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

const VuePdfEmbed = defineAsyncComponent(async () => {
  const { GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = workerUrl;
  return import("vue-pdf-embed");
});

const props = defineProps<{
  record: RecordModel
  attachmentField: string
  attachmentName: string
  token: string
}>()

const pdfFailed = ref(false);

function getMimeCategory(filename: string): "image" | "pdf" | "unknown" {
  const lower = filename.toLowerCase();
  if (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".webp")
  )
    return "image";
  if (lower.endsWith(".pdf")) return "pdf";
  return "unknown";
}

const mimeCategory = computed(() =>
  getMimeCategory((props.record as Record<string, string>)[props.attachmentField] ?? '')
)

const tokenUrl = computed(() =>
  pb.files.getURL(props.record, (props.record as Record<string, string>)[props.attachmentField] ?? '', { token: props.token })
)

const thumbUrl = computed(() =>
  pb.files.getURL(props.record, (props.record as Record<string, string>)[props.attachmentField] ?? '', {
    thumb: "400x400",
    token: props.token,
  })
)

function onPdfError(): void {
  pdfFailed.value = true;
}
</script>

<template>
  <div v-if="(record as Record<string, string>)[attachmentField]">
    <!-- Image branch -->
    <img
      v-if="mimeCategory === 'image'"
      :src="thumbUrl"
      :alt="attachmentName"
      class="max-w-full rounded shadow-sm"
      style="max-height: 480px; object-fit: contain;"
    />

    <!-- PDF branch — lazy loaded via defineAsyncComponent, Suspense required -->
    <template v-else-if="mimeCategory === 'pdf'">
      <Suspense>
        <VuePdfEmbed
          :source="tokenUrl"
          :page="1"
          class="w-full"
          @loading-failed="onPdfError"
        />
        <template #fallback>
          <div class="flex flex-col items-center py-6 gap-2">
            <Skeleton height="12rem" class="w-full" />
            <p class="text-sm" style="color: var(--color-typo-muted)">Loading PDF preview…</p>
          </div>
        </template>
      </Suspense>

      <!-- PDF error fallback -->
      <div v-if="pdfFailed" class="flex flex-col gap-2 mt-2">
        <p class="text-sm" style="color: var(--color-typo-muted)">
          Preview unavailable for this file.
        </p>
        <a :href="tokenUrl" download class="text-sm underline" style="color: var(--color-typo-link)">
          Download PDF
        </a>
      </div>
    </template>

    <!-- Unknown MIME branch -->
    <div v-else class="flex flex-col gap-2">
      <p class="text-sm" style="color: var(--color-typo-muted)">
        Preview not available for this file type.
      </p>
      <a :href="tokenUrl" download class="text-sm underline" style="color: var(--color-typo-link)">
        Download attachment
      </a>
    </div>
  </div>

  <!-- No attachment fallback -->
  <p v-else class="text-sm" style="color: var(--color-typo-muted)">No attachment.</p>
</template>
