<template>
  <CommonAlert color="info" size="2xs" hide-icon :actions="actions">
    <template #description>
      Upgrade to view comments older than {{ commentLimit }} days.
    </template>
  </CommonAlert>
</template>
<script setup lang="ts">
import type { AlertAction } from '@speckle/ui-components'
import { useNavigation } from '~/lib/navigation/composables/navigation'
import { useWorkspacePlanLimits } from '~/lib/workspaces/composables/limits'
import { settingsWorkspaceRoutes } from '~~/lib/common/helpers/route'

const { activeWorkspaceSlug } = useNavigation()
const { commentLimit } = useWorkspacePlanLimits()

const actions = computed((): AlertAction[] => [
  {
    title: 'Upgrade',
    onClick: () =>
      navigateTo(settingsWorkspaceRoutes.billing.route(activeWorkspaceSlug.value || ''))
  }
])
</script>
