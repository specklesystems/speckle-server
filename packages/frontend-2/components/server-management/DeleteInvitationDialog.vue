<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :title="title" :buttons="buttons">
    <div class="flex flex-col gap-6 text-sm text-foreground">
      <p>Are you sure you want to delete the selected invitation?</p>
      <div v-if="user" class="flex">
        <div class="flex flex-col pr-2 gap-2">
          <span>Email:</span>
          <span>Invited by:</span>
        </div>
        <div class="flex flex-col gap-2">
          <strong>{{ user?.email }}</strong>
          <div class="flex items-center gap-2">
            <img
              :src="user.profilePicture"
              :alt="'Profile picture of ' + user.invitedBy"
              class="w-6 h-6 rounded-full"
            />
            {{ user.invitedBy }}
          </div>
        </div>
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
  title: string
  open: boolean
  user: User | null
  buttons?: Array<{ text: string; props: Record<string, unknown>; onClick: () => void }>
}>()

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
