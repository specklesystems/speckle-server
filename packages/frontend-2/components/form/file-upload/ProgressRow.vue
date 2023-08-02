<template>
  <div class="bg-foundation rounded-4xl px-4 py-3 w-full max-w-full relative">
    <div class="flex space-x-1 items-center">
      <span class="truncate text-sm flex-shrink">{{ item.file.name }}</span>
      <span class="text-tiny flex-grow text-foreground-2">
        {{ prettyFileSize(item.file.size) }}
      </span>
      <FormButton
        color="danger"
        size="xs"
        rounded
        hide-text
        :icon-left="XMarkIcon"
        @click="onDelete"
      ></FormButton>
    </div>
    <div
      v-if="item.progress > 0"
      :class="[' w-full mt-2', progressBarClasses]"
      :style="progressBarStyle"
    />
    <div v-if="false" class="flex flex-col flex-grow">
      <div class="text-foreground space-x-1 inline-flex max-w-full truncate">
        <span class="normal truncate">{{ item.file.name }}</span>
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
    <FormButton
      v-if="false"
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
import {
  UploadFileItem,
  useFileUploadProgressCore
} from '~~/lib/form/composables/fileUpload'

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

const onDelete = () => {
  if (props.disabled) return
  emit('delete', { id: props.item.id })
}
</script>
