<template>
  <div :class="containerClasses">
    <div class="flex space-x-1 items-center">
      <span class="truncate text-xs pr-2 flex-1">{{ item.file.name }}</span>
      <span class="text-tiny text-foreground-2">
        {{ prettyFileSize(item.file.size) }}
      </span>
      <button class="p-0.5 text-foreground hover:text-primary" @click="onDelete">
        <XMarkIcon class="h-4 w-4" alt="delete" />
      </button>
    </div>
    <div
      v-if="item.progress > 0 && item.progress < 100"
      :class="[' w-full mt-2', progressBarClasses]"
      :style="progressBarStyle"
    />
    <div v-if="errorMessage" class="flex">
      <span class="text-tiny text-danger">
        {{ errorMessage }}
      </span>
    </div>

    <div v-if="false" class="flex flex-col flex-grow">
      <div class="text-foreground space-x-1 inline-flex max-w-full truncate">
        <span class="text-body-3xs truncate">{{ item.file.name }}</span>
        <span class="label label--light text-foreground-2 truncate">
          {{ prettyFileSize(item.file.size) }}
        </span>
      </div>
      <div v-if="errorMessage" class="label label--light text-danger truncate">
        {{ errorMessage }}
      </div>
      <div
        v-if="item.progress > 0"
        :class="progressBarClasses"
        :style="progressBarStyle"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { prettyFileSize } from '~~/lib/core/helpers/file'
import { useFileUploadProgressCore } from '~~/lib/form/composables/fileUpload'
import type { UploadFileItem } from '~~/lib/form/composables/fileUpload'

const emit = defineEmits<{
  (e: 'delete', v: { id: string }): void
}>()

const props = defineProps<{
  item: UploadFileItem
  disabled?: boolean
}>()

const { errorMessage, progressBarClasses, progressBarStyle } =
  useFileUploadProgressCore({
    item: computed(() => props.item)
  })

const containerClasses = computed(() => {
  const classParts = [
    'bg-foundation-page dark:bg-foundation border rounded-lg p-1.5 pl-2 w-full max-w-full relative'
  ]

  if (errorMessage.value) {
    classParts.push(' border-danger')
  } else {
    classParts.push('border-outline-3 ')
  }

  return classParts.join(' ')
})

const onDelete = () => {
  if (props.disabled) return
  emit('delete', { id: props.item.id })
}
</script>
