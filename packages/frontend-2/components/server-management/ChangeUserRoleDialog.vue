<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :title="title" :buttons="buttons">
    <div class="flex flex-col gap-6 text-sm text-foreground">
      <p>
        Are you sure you want to
        <strong>change the role of</strong>
        the selected user?
      </p>
      <div v-if="user && newRole && oldRole" class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <Avatar :user="user" />
          {{ user.name }}
        </div>
        <div class="flex gap-2 items-center">
          <span class="capitalize">{{ getRoleLabel(oldRole) }}</span>
          <ArrowLongRightIcon class="h-6 w-6" />
          <strong class="capitalize">{{ getRoleLabel(newRole) }}</strong>
        </div>
      </div>

      <div
        v-if="user && newRole === Roles.Server.Admin"
        class="flex gap-2 items-center bg-danger-lighter border-danger-darker border rounded-lg p-2"
      >
        <ExclamationTriangleIcon class="h-8 w-8 mt-0.5 text-danger-darker" />
        <div>
          <p>Make sure you trust {{ user.name }}!</p>
          <p>An admin on the server has access to every resource.</p>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDialog } from '@speckle/ui-components'
import { UserItem } from '~~/lib/server-management/helpers/types'
import { Roles, ServerRoles } from '@speckle/shared'
import { ArrowLongRightIcon, ExclamationTriangleIcon } from '@heroicons/vue/20/solid'
import Avatar from '~~/components/user/Avatar.vue'
import { getRoleLabel } from '~~/lib/server-management/helpers/utils'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  title: string
  open: boolean
  user: UserItem | null
  oldRole: ServerRoles | undefined
  newRole: ServerRoles | undefined
  buttons?: Array<{ text: string; props: Record<string, unknown>; onClick: () => void }>
}>()

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
