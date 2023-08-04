<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :title="title" :buttons="buttons">
    <div class="flex flex-col gap-6">
      <p>
        Are you sure you want to
        <strong>permanently delete</strong>
        the selected user?
      </p>
      <div v-if="user" class="flex items-center gap-2">
        <img
          :src="user.profilePicture"
          :alt="'Profile picture of ' + user.name"
          class="w-6 h-6 rounded-full"
        />
        {{ user.name }}
      </div>
      <p>
        This action
        <strong>cannot</strong>
        be undone.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDialog } from '@speckle/ui-components'
import { User } from '../../pages/server-management/active-users.vue'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  open: boolean
  user: User | null
}>()

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
