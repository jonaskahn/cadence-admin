<script setup lang="ts">
import { getApiErrorMessage } from '~/utils'

const props = defineProps<{
  orgId: string
  isAdmin?: boolean
}>()

const emit = defineEmits<{ close: [] }>()
const toast = useToast()
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const uploading = ref(false)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  selectedFile.value = input.files?.[0] || null
}

async function onUpload() {
  if (!selectedFile.value) return
  uploading.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const url = props.isAdmin
      ? '/api/admin/plugins/upload'
      : `/api/orgs/${props.orgId}/plugins/upload`

    await $fetch(url, {
      method: 'POST',
      body: formData
    })
    toast.add({ title: 'Plugin uploaded', icon: 'i-lucide-check', color: 'success' })
    emit('close')
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, 'Upload failed')
    toast.add({ title: 'Upload failed', description: msg, color: 'error' })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <UCard class="w-full">
    <template #header>
      <p class="font-semibold">Upload Plugin</p>
    </template>

    <div class="flex flex-col gap-4">
      <div
        class="border-2 border-dashed border-default rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        @click="fileInput?.click()"
      >
        <UIcon name="i-lucide-upload" class="size-10 mx-auto mb-2 text-dimmed" />
        <p class="text-sm font-medium">
          {{ selectedFile ? selectedFile.name : 'Click to select plugin (.zip)' }}
        </p>
        <p v-if="!selectedFile" class="text-xs text-dimmed mt-1">Plugin package in ZIP format</p>
        <input ref="fileInput" type="file" accept=".zip" class="hidden" @change="onFileChange" />
      </div>

      <div class="flex justify-end gap-2">
        <UButton label="Cancel" variant="ghost" color="neutral" @click="emit('close')" />
        <UButton
          label="Upload"
          icon="i-lucide-upload"
          :loading="uploading"
          :disabled="!selectedFile"
          @click="onUpload"
        />
      </div>
    </div>
  </UCard>
</template>
