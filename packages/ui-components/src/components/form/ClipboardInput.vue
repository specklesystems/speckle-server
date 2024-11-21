<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<template>
  <div
    class="relative group bg-foundation border border-outline-2 p-2 rounded-lg pr-20"
  >
    <div
      v-if="isMultiline"
      class="relative z-10 text-body-2xs select-all text-foreground font-mono break-all p-2 pl-3 max-h-[4.8rem] simple-scrollbar overflow-y-auto"
      @keypress="keyboardClick(selectAllText)"
    >
      {{ value }}
    </div>
    <FormTextInput
      v-else
      color="transparent"
      name="contentInput"
      readonly
      :model-value="value"
      class="relative z-10 text-sm text-foreground font-mono select-all"
    />
    <div class="absolute top-3 right-2 flex justify-end items-center">
      <FormButton
        color="outline"
        size="sm"
        :icon-left="
          isIconButton
            ? copied
              ? ClipboardDocumentCheckIcon
              : ClipboardDocumentIcon
            : undefined
        "
        :hide-text="isIconButton"
        @click="handleCopy"
      >
        {{ copied ? 'Copied' : 'Copy' }}
      </FormButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import {
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/vue/24/outline'
import { FormTextInput, FormButton } from '~~/src/lib'
import { ref } from 'vue'
import { keyboardClick } from '~~/src/helpers/global/accessibility'

type Props = {
  value: string
  isMultiline?: boolean
  isIconButton?: boolean
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  isMultiline: false
})

const emit = defineEmits<{ (e: 'copy', val: string): void }>()

const { copy } = useClipboard({ legacy: true })

const copied = ref(false)

const handleCopy = async () => {
  if (props.value) {
    await copy(props.value)
    copied.value = true
    emit('copy', props.value)

    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

const selectAllText = (event: Event) => {
  const textElement = event.target as HTMLElement

  const selection = window.getSelection()
  if (selection) {
    const range = document.createRange()
    range.selectNodeContents(textElement)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}
</script>
