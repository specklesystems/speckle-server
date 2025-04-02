<template>
  <CommonAlert color="info" size="2xs" hide-icon :actions="actions">
    <template #description>
      Upgrade to view comments older than {{ limit }} days.
    </template>
  </CommonAlert>
</template>
<script setup lang="ts">
import type { AlertAction } from '@speckle/ui-components'
import { settingsWorkspaceRoutes } from '~~/lib/common/helpers/route'

defineProps<{
  limit: number
}>()

const actions = computed((): AlertAction[] => [
  {
    title: 'Upgrade',
    onClick: () => navigateTo(settingsWorkspaceRoutes.billing)
  }
])
</script>
