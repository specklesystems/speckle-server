<template>
  <div class="flex flex-col space-y-2">
    <div class="flex">
      <div class="flex flex-col px-2 space-y-1" :class="{ invisible: !activeImageUrl }">
        <FormButton
          v-tippy="'Rotate left'"
          :icon-left="ArrowUturnLeftIcon"
          hide-text
          color="outline"
          @click="rotateLeft"
        />
        <FormButton
          v-tippy="'Rotate right'"
          :icon-left="ArrowUturnRightIcon"
          hide-text
          color="outline"
          @click="rotateRight"
        />
        <FormButton
          v-tippy="'Flip vertically'"
          :icon-left="ArrowUpOnSquareIcon"
          hide-text
          color="outline"
          @click="flipVertical"
        />
        <FormButton
          v-tippy="'Flip horizontally'"
          :icon-left="ArrowLeftOnRectangleIcon"
          hide-text
          color="outline"
          @click="flipHorizontal"
        />
      </div>
      <Cropper
        v-if="activeImageUrl"
        ref="cropper"
        class="cropper"
        :src="activeImageUrl"
        :stencil-props="{
          aspectRatio: 1 / 1
        }"
        :canvas="canvasSize"
        :style="`width: ${canvasSize.width}px; height: ${canvasSize.height}px`"
      />
      <FormFileUploadZone
        ref="uploadZone"
        v-slot="{ isDraggingFiles, activatorOn }"
        class="cropper flex items-center justify-center"
        :class="{ hidden: activeImageUrl }"
        accept="image/*"
        :size-limit="5 * 1024 * 1024"
        @files-selected="onFilesSelected"
      >
        <div
          class="cursor-pointer text-center w-full h-full border-dashed border-2 rounded-md p-4 flex items-center justify-center text-sm text-foreground-2"
          :class="[getDashedBorderClasses(isDraggingFiles)]"
          v-on="activatorOn"
        >
          Click here or drag and drop an image
        </div>
      </FormFileUploadZone>
      <div class="flex flex-col px-2 space-y-1" :class="{ invisible: !activeImageUrl }">
        <FormButton
          v-tippy="'Replace image'"
          :icon-left="PhotoIcon"
          hide-text
          @click="onReplace"
        />
        <FormButton
          v-tippy="'Remove'"
          :icon-left="XMarkIcon"
          hide-text
          color="danger"
          @click="onRemove"
        />
      </div>
    </div>
    <div class="flex mx-14 space-x-2">
      <div class="grow" />
      <FormButton color="outline" @click="$emit('cancel')">Close</FormButton>
      <FormButton :disabled="disabled" @click="onSave">Save</FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowLeftOnRectangleIcon,
  ArrowUpOnSquareIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/vue/24/outline'
import type { Nullable } from '@speckle/shared'
import { onUnmounted, ref, watch, computed } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import FormButton from '~~/src/components/form/Button.vue'
import FormFileUploadZone from '~~/src/components/form/file-upload/Zone.vue'
import type { UploadableFileItem } from '~~/src/composables/form/fileUpload'
import type { AvatarUser, UserAvatarSize } from '~~/src/composables/user/avatar'
import { directive as vTippy } from 'vue-tippy'

/**
 * Always try to lazy load this, as it's quite heavy
 */

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'save', val: Nullable<string>): void
}>()

const props = defineProps<{
  user: AvatarUser
  disabled?: boolean
  size?: UserAvatarSize
}>()

const cropper = ref(
  null as Nullable<{
    flip: (x: number, y: number) => void
    rotate: (angle: number) => void
    getResult: () => { canvas: HTMLCanvasElement }
  }>
)
const uploadZone = ref(null as Nullable<{ triggerPicker: () => void }>)
const selectedUpload = ref(null as Nullable<UploadableFileItem>)
const activeImageUrl = ref(null as Nullable<string>)

const canvasSize = computed(() => {
  switch (props.size) {
    case 'xs' || 'sm' || 'lg' || 'xl':
      return { width: 64, height: 64 }
    case 'xxl':
      return { width: 140, height: 140 }
    case 'editable':
      return { width: 240, height: 240 }
    case 'base':
    default:
      return { width: 32, height: 32 }
  }
})

const setNewActiveUrl = (url: Nullable<string>) => {
  if (activeImageUrl.value) {
    URL.revokeObjectURL(activeImageUrl.value)
  }

  activeImageUrl.value = url
}

const onFilesSelected = (params: { files: UploadableFileItem[] }) => {
  const file = params.files[0]
  if (!file) return
  selectedUpload.value = file
}

const getDashedBorderClasses = (isDraggingFiles: boolean) => {
  if (isDraggingFiles) return 'border-primary'
  if (selectedUpload.value?.error) return 'border-danger'

  return 'border-outline-2'
}

const rotateLeft = () => cropper.value?.rotate(-90)
const rotateRight = () => cropper.value?.rotate(90)
const flipHorizontal = () => cropper.value?.flip(1, 0)
const flipVertical = () => cropper.value?.flip(0, 1)

const onReplace = () => uploadZone.value?.triggerPicker()
const onRemove = () => {
  selectedUpload.value = null
  activeImageUrl.value = null
}
const onSave = () => {
  const newUrl = cropper.value?.getResult().canvas.toDataURL('image/jpeg', 0.85) || null
  emit('save', newUrl)
}

onUnmounted(() => {
  setNewActiveUrl(null)
})

watch(
  () => props.user.avatar,
  (newAvatar) => {
    activeImageUrl.value = newAvatar || null
  },
  { immediate: true }
)

watch(
  selectedUpload,
  (newUpload) => {
    activeImageUrl.value =
      newUpload?.file && !newUpload.error ? URL.createObjectURL(newUpload.file) : null
  },
  { deep: true }
)
</script>
