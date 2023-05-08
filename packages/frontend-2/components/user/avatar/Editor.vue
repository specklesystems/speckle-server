<template>
  <div class="flex flex-col space-y-2">
    <div class="flex">
      <div class="flex flex-col px-2 space-y-1" :class="{ invisible: !activeImageUrl }">
        <FormButton
          v-tippy="'Rotate left'"
          :icon-left="ArrowUturnLeftIcon"
          hide-text
          size="sm"
          outlined
          @click="rotateLeft"
        />
        <FormButton
          v-tippy="'Rotate right'"
          :icon-left="ArrowUturnRightIcon"
          hide-text
          size="sm"
          outlined
          @click="rotateRight"
        />
        <FormButton
          v-tippy="'Flip vertically'"
          :icon-left="ArrowUpOnSquareIcon"
          hide-text
          size="sm"
          outlined
          @click="flipVertical"
        />
        <FormButton
          v-tippy="'Flip horizontally'"
          :icon-left="ArrowLeftOnRectangleIcon"
          hide-text
          size="sm"
          outlined
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
        :canvas="{
          width: 250,
          height: 250
        }"
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
          size="sm"
          @click="onReplace"
        />
        <FormButton
          v-tippy="'Remove'"
          :icon-left="XMarkIcon"
          hide-text
          size="sm"
          color="danger"
          @click="onRemove"
        />
      </div>
    </div>
    <div class="flex mx-14 space-x-2">
      <div class="grow" />
      <FormButton color="secondary" size="sm" @click="$emit('cancel')">
        Cancel
      </FormButton>
      <FormButton size="sm" :disabled="loading" @click="onSave">Save</FormButton>
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
import { Nullable } from '@speckle/shared'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { graphql } from '~~/lib/common/generated/gql'
import { UserAvatarEditor_UserFragment } from '~~/lib/common/generated/gql/graphql'
import { UploadableFileItem } from '~~/lib/form/composables/fileUpload'
import { useUpdateUserProfile } from '~~/lib/user/composables/management'

/**
 * Always try to lazy load this, as it's quite heavy
 */

graphql(`
  fragment UserAvatarEditor_User on User {
    id
    avatar
  }
`)

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'save', val: Nullable<string>): void
}>()

const props = defineProps<{
  user: UserAvatarEditor_UserFragment
}>()

const { mutate, loading } = useUpdateUserProfile()

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

const saveChanges = async (newUrl: Nullable<string>) => {
  if (props.user.avatar === newUrl) return
  if (loading.value) return

  const result = await mutate({
    avatar: newUrl || ''
  })
  return !!result?.data?.activeUserMutations.update
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
const onSave = async () => {
  const newUrl = cropper.value?.getResult().canvas.toDataURL('image/jpeg', 0.85) || null
  const success = await saveChanges(newUrl)
  if (success) emit('save', newUrl)
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
<style lang="postcss">
.cropper {
  width: 250px;
  height: 250px;
}
</style>
