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
import { useMixpanel } from '~/lib/core/composables/mp'

const props = defineProps<{
  limitType: 'comment' | 'version'
}>()

const { activeWorkspaceSlug } = useNavigation()
const mixpanel = useMixpanel()

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
    onClick: handleUpgradeClick
  }
])

const handleUpgradeClick = () => {
  // Track the appropriate event based on the limit type
  mixpanel.track(
    props.limitType === 'comment'
      ? 'Hidden Comment Upgrade Button Clicked'
      : 'Hidden Version Upgrade Button Clicked',
    {
      location: 'viewer',
      // eslint-disable-next-line camelcase
      workspace_id: activeWorkspaceSlug.value
    }
  )
  return navigateTo(
    settingsWorkspaceRoutes.billing.route(activeWorkspaceSlug.value || '')
  )
}
</script>
