<template>
  <CommonAlert
    class="!bg-foundation !text-foreground-2"
    size="2xs"
    hide-icon
    :actions="actions"
  >
    <template #description>Upgrade to view versions older than 7 days.</template>
  </CommonAlert>
</template>
<script setup lang="ts">
import type { AlertAction } from '@speckle/ui-components'
import { useNavigation } from '~/lib/navigation/composables/navigation'
import { settingsWorkspaceRoutes } from '~~/lib/common/helpers/route'

const { activeWorkspaceSlug } = useNavigation()

const actions = computed((): AlertAction[] => [
  {
    title: 'Upgrade',
    onClick: () =>
      navigateTo(settingsWorkspaceRoutes.billing.route(activeWorkspaceSlug.value || ''))
  }
])
</script>
