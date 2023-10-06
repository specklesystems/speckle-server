<template>
  <div class="flex justify-center">
    <LazyUserAvatarEditor
      v-if="editMode"
      :user="user"
      @cancel="editMode = false"
      @save="onSave"
    />
    <div v-else class="relative group">
      <UserAvatar :user="user" size="editable" />
      <div
        class="opacity-0 transition-all absolute group-hover:opacity-100 inset-0 flex items-end justify-center bottom-4"
      >
        <FormButton color="secondary" @click="editMode = true">Change</FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Nullable } from '@speckle/shared'
import { defineAsyncComponent, ref, watch } from 'vue'
import FormButton from '~~/src/components/form/Button.vue'
import UserAvatar from '~~/src/components/user/Avatar.vue'
import { AvatarUser } from '~~/src/composables/user/avatar'

const LazyUserAvatarEditor = defineAsyncComponent(
  () => import('~~/src/components/user/AvatarEditor.vue')
)

const emit = defineEmits<{
  (e: 'save', newUrl: Nullable<string>): void
}>()

const props = defineProps<{
  user: AvatarUser
}>()

const editMode = ref(false)

const onSave = (newUrl: Nullable<string>) => {
  emit('save', newUrl)
}

const open = () => (editMode.value = true)
const close = () => (editMode.value = false)

watch(
  () => props.user.avatar,
  () => {
    editMode.value = false
  }
)

defineExpose({ open, close })
</script>
