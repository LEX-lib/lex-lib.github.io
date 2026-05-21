<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import imageCompression from 'browser-image-compression'
import { toast } from 'vue-sonner'
import dayjs from 'dayjs'
import { pb } from '@/lib/pocketbase'
import { mapToUpdateExpense } from '@/lib/pocketbase/expenseMapper'
import { expenseSchema, DEFAULT_EXPENSE_CATEGORIES } from '@/lib/wallecx/expenseSchema'
import type { Expenses } from '@/types/wallecx/expenses/types'
import type { ExpenseCategories } from '@/types/wallecx/expense-categories/types'
import { useIsMobile } from '@/composables/useIsMobile'

const visible = defineModel('visible', { type: Boolean, default: false, required: true })
const record = defineModel<Expenses | null>('record', { default: null })

const emit = defineEmits<{
  created: [record: Expenses]
  updated: [record: Expenses]
}>()

const isMobile = useIsMobile()
const isSaving = ref(false)
const pendingFile = ref<File | null>(null)
const loadedCategories = ref<ExpenseCategories[]>([])
const isLoadingCategories = ref(false)

const isEditMode = computed(() => record.value !== null)
const dialogHeader = computed(() => (isEditMode.value ? 'Edit Expense' : 'Add Expense'))

// Form refs (D-13 through D-17)
const amount = ref<number | null>(null)
const expenseDate = ref<Date>(new Date())
const category = ref<string>('')
const description = ref<string>('')
const notes = ref<string>('')

// Error refs — one per required field
const amountError = ref<string>('')
const expenseDateError = ref<string>('')
const categoryError = ref<string>('')
const descriptionError = ref<string>('')

// Record watcher — initialises form refs when record prop changes (mirrors ManageMembership.vue watch pattern exactly)
watch(
  () => record.value,
  (rec) => {
    if (rec) {
      amount.value = rec.amount
      expenseDate.value = new Date(rec.expense_date)
      category.value = rec.category
      description.value = rec.description
      notes.value = rec.notes ?? ''
    } else {
      amount.value = null
      expenseDate.value = new Date()
      category.value = ''
      description.value = ''
      notes.value = ''
    }
    pendingFile.value = null
    amountError.value = ''
    expenseDateError.value = ''
    categoryError.value = ''
    descriptionError.value = ''
  },
  { immediate: true },
)

// Visible watcher — loads categories when dialog opens (D-21)
watch(visible, async (isOpen) => {
  if (!isOpen) return
  await loadCategories()
})

async function loadCategories(): Promise<void> {
  const userId = pb.authStore.record?.id
  if (!userId) return

  try {
    const cats = await pb.collection('wallecx_expense_categories').getFullList<ExpenseCategories>({
      requestKey: 'expense-categories-getFullList',
    })

    if (cats.length === 0) {
      isLoadingCategories.value = true
      try {
        await Promise.all(
          DEFAULT_EXPENSE_CATEGORIES.map((name) =>
            pb.collection('wallecx_expense_categories').create({ user: userId, name }),
          ),
        )
        const seeded = await pb.collection('wallecx_expense_categories').getFullList<ExpenseCategories>({
          requestKey: 'expense-categories-getFullList',
        })
        loadedCategories.value = seeded
      } finally {
        isLoadingCategories.value = false
      }
    } else {
      loadedCategories.value = cats
    }
  } catch {
    toast.error('Failed to load categories. Please try again.')
  }
}

// Thumbnail computed — edit mode receipt preview (UI-SPEC receipt field spec)
const receiptThumbnailUrl = computed(() => {
  if (!isEditMode.value || !record.value?.receipt) return null
  const filename = record.value.receipt
  if (filename.toLowerCase().endsWith('.pdf')) return null
  return pb.files.getURL(record.value, filename, { thumb: '100x100' })
})

const hasExistingPdf = computed(
  () =>
    isEditMode.value &&
    !!record.value?.receipt &&
    record.value.receipt.toLowerCase().endsWith('.pdf'),
)

// File select handler — EXIF strip + compression for images, direct assign for PDF (D-17)
async function onFileSelect(event: { files: File[] }): Promise<void> {
  const file = event.files[0]
  if (!file) return

  if (file.size > 10 * 1024 * 1024) {
    toast.error('File too large. Maximum size is 10 MB.')
    return
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    toast.error('File type not supported. Use JPEG, PNG, WebP, or PDF.')
    return
  }

  if (file.type === 'application/pdf') {
    pendingFile.value = file
    return
  }

  // Image: canvas EXIF strip then compression
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = await createImageBitmap(file)
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    const strippedBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
        file.type,
      ),
    )
    const strippedFile = new File([strippedBlob], file.name, { type: file.type })
    const compressed = await imageCompression(strippedFile, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
    })
    pendingFile.value = new File([compressed], file.name, { type: file.type })
    toast.info('Location data removed.')
  } catch {
    toast.error('Failed to process image. Please try again.')
    pendingFile.value = null
  }
}

function onHide(): void {
  pendingFile.value = null
}

async function onSubmit(): Promise<void> {
  amountError.value = ''
  expenseDateError.value = ''
  categoryError.value = ''
  descriptionError.value = ''

  const payload = {
    amount: amount.value ?? 0,
    expense_date: dayjs(expenseDate.value).format('YYYY-MM-DD'),
    category: category.value,
    description: description.value,
    notes: notes.value || undefined,
  }

  const result = expenseSchema.safeParse(payload)
  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors
    amountError.value = fieldErrors.amount?.[0] ?? ''
    expenseDateError.value = fieldErrors.expense_date?.[0] ?? ''
    categoryError.value = fieldErrors.category?.[0] ?? ''
    descriptionError.value = fieldErrors.description?.[0] ?? ''
    return
  }

  // Auth null guard (D-11)
  const userId = pb.authStore.record?.id
  if (!userId) {
    toast.error('Session expired. Please log in again.')
    return
  }

  isSaving.value = true
  try {
    // New category creation before expense save (D-18, D-19)
    const existingMatch = loadedCategories.value.find((c) => c.name === category.value)
    if (!existingMatch) {
      try {
        await pb.collection('wallecx_expense_categories').create({
          user: userId,
          name: category.value,
        })
      } catch {
        toast.error('Failed to save category. Please try again.')
        return
      }
    }

    // Build FormData
    const formData = new FormData()
    const roundedAmount = Math.round((amount.value ?? 0) * 100) / 100
    formData.append('user', userId)
    formData.append('amount', String(roundedAmount))
    formData.append('expense_date', dayjs(expenseDate.value).format('YYYY-MM-DD'))
    formData.append('category', category.value)
    formData.append('description', description.value)
    if (notes.value) formData.append('notes', notes.value)
    if (pendingFile.value) formData.append('receipt', pendingFile.value)

    if (isEditMode.value && record.value) {
      void mapToUpdateExpense // confirms writable field set (mirrors ManageMembership pattern)
      const updated = await pb.collection('wallecx_expenses').update<Expenses>(
        record.value.id,
        formData,
        { requestKey: 'expenses-update' },
      )
      emit('updated', updated)
      toast.success('Expense updated.')
    } else {
      const created = await pb.collection('wallecx_expenses').create<Expenses>(formData, {
        requestKey: 'expenses-create',
      })
      emit('created', created)
      toast.success('Expense added.')
    }

    pendingFile.value = null
    visible.value = false
  } catch {
    toast.error('Failed to save. Please try again.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <!-- Desktop: centered Dialog -->
  <Dialog
    v-if="!isMobile"
    modal
    v-model:visible="visible"
    :header="dialogHeader"
    :style="{ width: '40vw' }"
    :breakpoints="{ '960px': '75vw', '641px': '92vw' }"
    :closable="!isSaving && !isLoadingCategories"
    @hide="onHide"
  >
    <form @submit.prevent="onSubmit" class="space-y-4">
      <!-- Amount (required) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Amount *</label>
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium" style="color: var(--color-typo-body)">PHP</span>
          <InputNumber
            v-model="amount"
            fluid
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :min="0.01"
            :disabled="isSaving"
          />
        </div>
        <Message v-if="amountError" severity="error" size="small" variant="simple">
          {{ amountError }}
        </Message>
      </div>

      <!-- Date (required) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Date *</label>
        <DatePicker v-model="expenseDate" fluid dateFormat="dd M yy" :disabled="isSaving" />
        <Message v-if="expenseDateError" severity="error" size="small" variant="simple">
          {{ expenseDateError }}
        </Message>
      </div>

      <!-- Category (required, editable Select) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Category *</label>
        <Select
          v-model="category"
          fluid
          editable
          option-label="name"
          option-value="name"
          :options="loadedCategories"
          :loading="isLoadingCategories"
          :disabled="isLoadingCategories || isSaving"
          :placeholder="isLoadingCategories ? 'Loading categories…' : 'Select or type a category'"
        />
        <Message v-if="categoryError" severity="error" size="small" variant="simple">
          {{ categoryError }}
        </Message>
      </div>

      <!-- Description (required, char counter) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Description *</label>
        <InputText v-model="description" fluid :maxlength="120" :disabled="isSaving" />
        <div class="flex justify-end">
          <span class="text-xs" aria-live="polite" style="color: var(--color-typo-muted)">
            {{ description.length }}/120
          </span>
        </div>
        <Message v-if="descriptionError" severity="error" size="small" variant="simple">
          {{ descriptionError }}
        </Message>
      </div>

      <!-- Notes (optional) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">
          Notes
          <span class="text-xs" style="color: var(--color-typo-muted)">(optional)</span>
        </label>
        <Textarea v-model="notes" fluid :rows="3" :autoResize="false" :disabled="isSaving" />
      </div>

      <!-- Receipt (optional, FileUpload + edit-mode thumbnail) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Receipt</label>

        <template v-if="isEditMode && record?.receipt">
          <img
            v-if="receiptThumbnailUrl"
            :src="receiptThumbnailUrl"
            class="w-24 h-24 object-cover rounded"
            alt="Current receipt"
          />
          <div
            v-else-if="hasExistingPdf"
            class="w-24 h-24 flex items-center justify-center border rounded"
          >
            <i class="pi pi-file-pdf text-3xl" aria-label="Receipt (PDF)"></i>
          </div>
          <p class="text-sm" style="color: var(--color-typo-muted)">
            Current receipt — select a new file to replace it
          </p>
        </template>

        <FileUpload
          mode="basic"
          :auto="false"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          :chooseLabel="isEditMode && record?.receipt ? 'Replace file' : 'Choose File'"
          :disabled="isSaving"
          @select="onFileSelect"
        />

        <p v-if="pendingFile" class="text-sm" style="color: var(--color-typo-muted)">
          {{ pendingFile.name }} selected
        </p>
      </div>

      <!-- Submit button -->
      <Button
        type="submit"
        fluid
        :label="isEditMode ? 'Save Changes' : 'Add Expense'"
        :loading="isSaving || isLoadingCategories"
        :disabled="isSaving || isLoadingCategories"
      />
    </form>
  </Dialog>

  <!-- Mobile: bottom Drawer (85dvh cap via wallecx-overrides.css already applied) -->
  <Drawer
    v-else
    v-model:visible="visible"
    position="bottom"
    :show-close-icon="!isSaving && !isLoadingCategories"
    @hide="onHide"
  >
    <template #header>
      <div class="flex flex-col items-center w-full gap-1">
        <div class="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true"></div>
        <span class="font-semibold">{{ dialogHeader }}</span>
      </div>
    </template>

    <form @submit.prevent="onSubmit" class="space-y-4">
      <!-- Amount (required) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Amount *</label>
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium" style="color: var(--color-typo-body)">PHP</span>
          <InputNumber
            v-model="amount"
            fluid
            :minFractionDigits="2"
            :maxFractionDigits="2"
            :min="0.01"
            :disabled="isSaving"
          />
        </div>
        <Message v-if="amountError" severity="error" size="small" variant="simple">
          {{ amountError }}
        </Message>
      </div>

      <!-- Date (required) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Date *</label>
        <DatePicker v-model="expenseDate" fluid dateFormat="dd M yy" :disabled="isSaving" />
        <Message v-if="expenseDateError" severity="error" size="small" variant="simple">
          {{ expenseDateError }}
        </Message>
      </div>

      <!-- Category (required, editable Select) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Category *</label>
        <Select
          v-model="category"
          fluid
          editable
          option-label="name"
          option-value="name"
          :options="loadedCategories"
          :loading="isLoadingCategories"
          :disabled="isLoadingCategories || isSaving"
          :placeholder="isLoadingCategories ? 'Loading categories…' : 'Select or type a category'"
        />
        <Message v-if="categoryError" severity="error" size="small" variant="simple">
          {{ categoryError }}
        </Message>
      </div>

      <!-- Description (required, char counter) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Description *</label>
        <InputText v-model="description" fluid :maxlength="120" :disabled="isSaving" />
        <div class="flex justify-end">
          <span class="text-xs" aria-live="polite" style="color: var(--color-typo-muted)">
            {{ description.length }}/120
          </span>
        </div>
        <Message v-if="descriptionError" severity="error" size="small" variant="simple">
          {{ descriptionError }}
        </Message>
      </div>

      <!-- Notes (optional) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">
          Notes
          <span class="text-xs" style="color: var(--color-typo-muted)">(optional)</span>
        </label>
        <Textarea v-model="notes" fluid :rows="3" :autoResize="false" :disabled="isSaving" />
      </div>

      <!-- Receipt (optional, FileUpload + edit-mode thumbnail) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Receipt</label>

        <template v-if="isEditMode && record?.receipt">
          <img
            v-if="receiptThumbnailUrl"
            :src="receiptThumbnailUrl"
            class="w-24 h-24 object-cover rounded"
            alt="Current receipt"
          />
          <div
            v-else-if="hasExistingPdf"
            class="w-24 h-24 flex items-center justify-center border rounded"
          >
            <i class="pi pi-file-pdf text-3xl" aria-label="Receipt (PDF)"></i>
          </div>
          <p class="text-sm" style="color: var(--color-typo-muted)">
            Current receipt — select a new file to replace it
          </p>
        </template>

        <FileUpload
          mode="basic"
          :auto="false"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          :chooseLabel="isEditMode && record?.receipt ? 'Replace file' : 'Choose File'"
          :disabled="isSaving"
          @select="onFileSelect"
        />

        <p v-if="pendingFile" class="text-sm" style="color: var(--color-typo-muted)">
          {{ pendingFile.name }} selected
        </p>
      </div>

      <!-- Submit button -->
      <Button
        type="submit"
        fluid
        :label="isEditMode ? 'Save Changes' : 'Add Expense'"
        :loading="isSaving || isLoadingCategories"
        :disabled="isSaving || isLoadingCategories"
      />
    </form>
  </Drawer>
</template>

<style scoped>
:deep(.my-app-dark .p-dialog),
:deep(.my-app-dark .p-dialog .p-dialog-content) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
}
:deep(.my-app-dark .p-drawer),
:deep(.my-app-dark .p-drawer .p-drawer-content) {
  background-color: var(--color-surface-card);
  color: var(--color-typo-body);
}
</style>
