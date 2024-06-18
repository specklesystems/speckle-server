<template>
  <div class="relative group">
    <FormTextArea
      name="codeOutput"
      readonly
      :model-value="content"
      class="text-sm text-primary font-mono"
      :rows="rows"
    />
    <FormButton
      v-if="showCopyButton"
      text
      class="shrink-0 absolute z-10 top-1 right-2 group-hover:opacity-100 opacity-0 transition-opacity duration-200"
      :icon-left="ClipboardDocumentIcon"
      hide-text
      @click="onCopy"
    ></FormButton>
  </div>
</template>
<script setup lang="ts">
import { ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { useClipboard } from '@vueuse/core'

const props = withDefaults(
  defineProps<{
    content: string
    showCopyButton?: boolean
    rows?: number
  }>(),
  { showCopyButton: true, rows: 15 }
)

const { copy } = useClipboard({ legacy: true })
const { triggerNotification } = useGlobalToast()

const onCopy = async () => {
  await copy(props.content)
  triggerNotification({
    type: ToastNotificationType.Info,
    title: 'Value copied to clipboard'
  })
}
</script>
