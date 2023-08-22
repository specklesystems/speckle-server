<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :title="title" :buttons="buttons">
    <div class="flex flex-col gap-6 text-sm text-foreground">
      <p>Are you sure you want to delete the selected invitation?</p>
      <div v-if="invite" class="flex flex-col gap-2">
        <div class="flex gap-1">
          <div class="w-20">Email:</div>
          <strong>{{ invite.email }}</strong>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-20">Invited by:</div>
          <UserAvatar :user="invite.invitedBy" />
          {{ invite.invitedBy.name }}
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
import { InviteItem } from '~~/lib/server-management/helpers/types'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  title: string
  open: boolean
  invite: InviteItem | null
  buttons?: Array<{ text: string; props: Record<string, unknown>; onClick: () => void }>
}>()

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
