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
import { useMobileEnv } from '@/composables/useMobileEnv'
import BaseMobileDialog from './BaseMobileDialog.vue'

const visible = defineModel('visible', { type: Boolean, default: false, required: true })
const record = defineModel<Expenses | null>('record', { default: null })

const emit = defineEmits<{
  created: [record: Expenses]
  updated: [record: Expenses]
}>()

const { isMobile } = useMobileEnv()
const isSaving = ref(false)
const pendingFile = ref<File | null>(null)
const loadedCategories = ref<ExpenseCategories[]>([])
const isLoadingCategories = ref(false)
const baseDialogRef = ref<InstanceType<typeof BaseMobileDialog> | null>(null)

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

// FD-09: Dirty snapshot — taken on dialog open
interface ExpenseSnapshot {
  amount: number | null
  expenseDate: string
  category: string
  description: string
  notes: string
  hasPendingFile: boolean
}

const snapshot = ref<ExpenseSnapshot | null>(null)

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

// Visible watcher — loads categories when dialog opens (D-21) + takes dirty snapshot
watch(visible, async (isOpen) => {
  if (!isOpen) {
    // Reset pending file on close (S-3 pattern)
    pendingFile.value = null
    // WR-01: reset transient save state so a dialog dismissed mid-save (e.g. via the FD-09
    // discard guard) does not reopen with the Save button stuck disabled. Mirrors ManageBudget.
    isSaving.value = false
    return
  }
  // Snapshot for dirty tracking (FD-09)
  snapshot.value = {
    amount: amount.value,
    expenseDate: expenseDate.value.toISOString(),
    category: category.value,
    description: description.value,
    notes: notes.value,
    hasPendingFile: false,
  }
  await loadCategories()
})

// FD-09: isDirty computed — passed to BaseMobileDialog
const isDirty = computed<boolean>(() => {
  if (!snapshot.value) return false
  return (
    amount.value !== snapshot.value.amount ||
    expenseDate.value.toISOString() !== snapshot.value.expenseDate ||
    category.value !== snapshot.value.category ||
    description.value !== snapshot.value.description ||
    notes.value !== snapshot.value.notes ||
    pendingFile.value !== null
  )
})

async function loadCategories(): Promise<void> {
  const userId = pb.authStore.record?.id
  if (!userId) return

  isLoadingCategories.value = true
  try {
    const cats = await pb.collection('wallecx_expense_categories').getFullList<ExpenseCategories>({
      requestKey: 'expense-categories-getFullList',
    })

    if (cats.length === 0) {
      // seeding path — flag already true, no double-set needed
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
      } catch {
        toast.error('Failed to seed categories. Please try again.')
      }
    } else {
      loadedCategories.value = cats
    }
  } catch {
    toast.error('Failed to load categories. Please try again.')
  } finally {
    isLoadingCategories.value = false
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
// DO NOT modify this function body — it enforces security-relevant 10MB + allowedTypes validation (T-35-04)
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

// FD-05: Raw file input bridge — routes camera/gallery input through the EXIF/compression pipeline
async function onRawFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = '' // reset so same file can be re-selected
  await onFileSelect({ files: [file] })
}

// FD-09: Explicit Cancel — close without triggering dirty guard
function onCancel(): void {
  baseDialogRef.value?.closeWithoutGuard()
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
    // FD-09: bypass dirty guard on successful save
    baseDialogRef.value?.closeWithoutGuard()
  } catch {
    toast.error('Failed to save. Please try again.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseMobileDialog
    ref="baseDialogRef"
    v-model:visible="visible"
    :title="dialogHeader"
    :is-dirty="isDirty"
    :is-saving="isSaving || isLoadingCategories"
  >
    <!-- #default slot: form body rendered ONCE (Pattern S-1) -->
    <form @submit.prevent="onSubmit" id="manage-expense-form" class="space-y-4">
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
            inputmode="decimal"
            enterkeyhint="next"
            autocomplete="off"
          />
        </div>
        <Message v-if="amountError" severity="error" size="small" variant="simple">
          {{ amountError }}
        </Message>
      </div>

      <!-- Date (required) — FD-04: tap-to-open popup overlay on all viewports.
           Inline mode reverted (it crowded the form/page); the FD-01 16px rule keeps
           the popup usable on mobile without iOS zoom. -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Date *</label>
        <DatePicker
          v-model="expenseDate"
          fluid
          dateFormat="dd M yy"
          :disabled="isSaving"
        />
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
          enterkeyhint="next"
        />
        <Message v-if="categoryError" severity="error" size="small" variant="simple">
          {{ categoryError }}
        </Message>
      </div>

      <!-- Description (required, char counter) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Description *</label>
        <InputText
          v-model="description"
          fluid
          :maxlength="120"
          :disabled="isSaving"
          inputmode="text"
          enterkeyhint="next"
          autocomplete="off"
        />
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
        <Textarea
          v-model="notes"
          fluid
          :rows="3"
          :autoResize="false"
          :disabled="isSaving"
          inputmode="text"
          enterkeyhint="done"
          autocomplete="off"
        />
      </div>

      <!-- Receipt (optional, two-affordance mobile + FileUpload desktop) -->
      <div class="flex flex-col gap-1">
        <label class="text-sm" style="color: var(--color-typo-heading)">Receipt</label>

        <!-- Edit mode: thumbnail / PDF icon preview -->
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

        <!-- FD-05: Mobile two-affordance — Take photo (camera) + Choose from gallery -->
        <template v-if="isMobile">
          <div class="flex gap-2">
            <label class="p-button p-button-outlined p-button-secondary p-button-sm min-h-[44px] cursor-pointer flex items-center gap-2 flex-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                class="hidden"
                :disabled="isSaving"
                @change="onRawFileChange"
              />
              <i class="pi pi-camera" aria-hidden="true"></i>
              Take photo
            </label>
            <label class="p-button p-button-outlined p-button-secondary p-button-sm min-h-[44px] cursor-pointer flex items-center gap-2 flex-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                class="hidden"
                :disabled="isSaving"
                @change="onRawFileChange"
              />
              <i class="pi pi-images" aria-hidden="true"></i>
              Choose from gallery
            </label>
          </div>
        </template>

        <!-- Desktop: existing FileUpload -->
        <FileUpload
          v-else
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
    </form>

    <!-- #actions slot: Save/Cancel buttons (UI-SPEC Contract 2) -->
    <template #actions>
      <div class="flex gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          fluid
          :disabled="isSaving || isLoadingCategories"
          @click="onCancel"
        />
        <Button
          type="submit"
          form="manage-expense-form"
          :label="isEditMode ? 'Save Changes' : 'Add Expense'"
          fluid
          :loading="isSaving || isLoadingCategories"
          :disabled="isSaving || isLoadingCategories"
        />
      </div>
    </template>
  </BaseMobileDialog>
</template>
