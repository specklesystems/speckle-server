<template>
  <CommonAlert class="select-none" size="2xs" color="info" hide-icon :actions="actions">
    <template #description>
      {{ text }}
    </template>
  </CommonAlert>
</template>
<script setup lang="ts">
import type { AlertAction } from '@speckle/ui-components'
import { useNavigation } from '~/lib/navigation/composables/navigation'
import { useWorkspaceLimits } from '~/lib/workspaces/composables/limits'
import { settingsWorkspaceRoutes } from '~~/lib/common/helpers/route'

const props = defineProps<{
  limitType: 'comment' | 'version'
}>()

const { activeWorkspaceSlug } = useNavigation()

const { commentLimitFormatted, versionLimitFormatted } = useWorkspaceLimits(
  activeWorkspaceSlug.value || ''
)

const text = computed(() => {
  if (props.limitType === 'comment') {
    return `Upgrade your plan to view comments older than ${commentLimitFormatted.value}.`
  }
  return `Upgrade your plan to view versions older than ${versionLimitFormatted.value}.`
})

const actions = computed((): AlertAction[] => [
  {
    title: 'Upgrade',
    onClick: () =>
      navigateTo(settingsWorkspaceRoutes.billing.route(activeWorkspaceSlug.value || ''))
  }
])
</script>
