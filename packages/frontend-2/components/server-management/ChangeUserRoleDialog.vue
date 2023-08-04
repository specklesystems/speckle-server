<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :title="title" :buttons="buttons">
    <div class="flex flex-col gap-6 text-sm text-foreground">
      <p>
        Are you sure you want to
        <strong>change the role of</strong>
        the selected user?
      </p>
      <div v-if="user" class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <img
            :src="user.profilePicture"
            :alt="'Profile picture of ' + user.name"
            class="w-6 h-6 rounded-full"
          />
          {{ user.name }}
        </div>
        <div class="flex gap-2 items-center">
          <span>{{ oldRole }}</span>
          <ArrowLongRightIcon class="h-6 w-6" />
          <strong>{{ newRole }}</strong>
        </div>
      </div>

      <div
        v-if="newRole === 'admin'"
        class="flex gap-2 items-center bg-danger-lighter border-danger-darker border rounded-lg p-2"
      >
        <ExclamationTriangleIcon class="h-8 w-8 mt-0.5 text-danger-darker" />
        <div>
          <p>Make sure you trust Devon Webb!</p>
          <p>An admin on the server has access to every resource.</p>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDialog } from '@speckle/ui-components'
import { User } from '../../pages/server-management/active-users.vue'
import { ArrowLongRightIcon, ExclamationTriangleIcon } from '@heroicons/vue/20/solid'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  title: string
  open: boolean
  user: User | null
  oldRole: string
  newRole: string
}>()

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
