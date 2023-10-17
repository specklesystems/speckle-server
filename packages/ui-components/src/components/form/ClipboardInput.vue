<template>
  <div class="relative group bg-foundation-page p-2 rounded-lg pr-12">
    <FormTextArea
      v-if="isMultiline"
      color="transparent"
      name="contentArea"
      readonly
      :model-value="value"
      class="relative z-10 text-sm text-foreground font-mono"
      :rows="rows"
    />
    <FormTextInput
      v-else
      color="transparent"
      name="contentInput"
      readonly
      :model-value="value"
      class="relative z-10 text-sm text-foreground font-mono"
    />
    <div class="absolute inset-0 right-2 flex justify-end items-center">
      <FormButton
        color="invert"
        size="sm"
        :icon-left="ClipboardDocumentIcon"
        hide-text
        @click="handleCopy"
      ></FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { FormTextArea, FormTextInput, FormButton } from '~~/src/lib'

const props = defineProps({
  value: String,
  isMultiline: Boolean,
  showNotificationOnCopy: Boolean,
  rows: Number
})

const emits = defineEmits(['copy'])

const { copy } = useClipboard()

const handleCopy = async () => {
  if (props.value) {
    await copy(props.value)
    emits('copy', props.value)
  }
}
</script>
