<script lang="ts" setup>
import { getApiErrorMessage } from '~/utils'

const { t } = useI18n()
const props = defineProps<{
  orgId: string
  isAdmin?: boolean
}>()

const emit = defineEmits<{ close: [] }>()

function handleClose() {
  emit('close')
}
const toast = useToast()
const { withOverlay } = useLoadingOverlay()
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const uploading = ref(false)

function triggerFileInput() {
  fileInput.value?.click()
}

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
    await withOverlay(async () => {
      const url = props.isAdmin ? '/api/admin/plugins/upload' : `/api/orgs/${props.orgId}/plugins/upload`

      await $fetch(url, {
        method: 'POST',
        body: formData
      })
      toast.add({ title: t('pluginUpload.uploaded'), icon: 'i-lucide-check', color: 'success' })
      emit('close')
    })
  } catch (err: unknown) {
    const msg = getApiErrorMessage(err, t('pluginUpload.uploadFailed'))
    toast.add({ title: t('pluginUpload.uploadFailed'), description: msg, color: 'error' })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <UCard class="w-full">
    <template #header>
      <p class="font-semibold">{{ t('pluginUpload.title') }}</p>
    </template>

    <div class="flex flex-col gap-4">
      <div
        class="border-2 border-dashed border-default rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        @click="triggerFileInput"
      >
        <UIcon class="size-10 mx-auto mb-2 text-dimmed" name="i-lucide-upload" />
        <p class="text-sm font-medium">
          {{ selectedFile ? selectedFile.name : t('pluginUpload.clickToSelect') }}
        </p>
        <p v-if="!selectedFile" class="text-xs text-dimmed mt-1">{{ t('pluginUpload.packageHint') }}</p>
        <input ref="fileInput" accept=".zip" class="hidden" type="file" @change="onFileChange" />
      </div>

      <div class="flex justify-end gap-2">
        <UButton color="neutral" :label="t('common.cancel')" variant="outline" @click="handleClose" />
        <UButton
          color="primary"
          variant="outline"
          :disabled="!selectedFile"
          :loading="uploading"
          icon="i-lucide-upload"
          :label="t('common.upload')"
          @click="onUpload"
        />
      </div>
    </div>
  </UCard>
</template>
