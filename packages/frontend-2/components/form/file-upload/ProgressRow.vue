<template>
  <div class="bg-foundation rounded-4xl px-4 py-3 flex w-full relative">
    <div class="flex flex-col shrink grow">
      <div class="text-foreground space-x-1 inline-flex">
        <span class="normal truncate">{{ item.file.name }}</span>
        <span class="label label--light text-foreground-2">
          {{ prettyFileSize(item.file.size) }}
        </span>
      </div>
      <div v-if="errorMessage" class="label label--light text-danger truncate">
        {{ errorMessage }}
      </div>
      <div
        v-if="item.progress > 0"
        :class="['h-1', progressBarColorClass]"
        :style="{ width: `${item.progress}%` }"
      />
    </div>
    <FormButton
      class="absolute -right-8 top-4"
      color="danger"
      size="xs"
      rounded
      hide-text
      :icon-left="XMarkIcon"
      @click="onDelete"
    ></FormButton>
  </div>
</template>
<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { prettyFileSize } from '~~/lib/core/helpers/file'
import { UploadFileItem } from '~~/lib/form/composables/fileUpload'

const emit = defineEmits<{
  (e: 'delete', v: { id: string }): void
}>()

const props = defineProps<{
  item: UploadFileItem
  disabled?: boolean
}>()

const errorMessage = computed(() => {
  if (props.item.error) return props.item.error.message
  if (props.item.result?.uploadError) return props.item.result.uploadError
  return null
})

const progressBarColorClass = computed(() => {
  if (errorMessage.value) return 'bg-danger'
  if (props.item.progress >= 100) return 'bg-success'
  return 'bg-primary'
})

const onDelete = () => {
  if (props.disabled) return
  emit('delete', { id: props.item.id })
}
</script>
