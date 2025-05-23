<template>
  <CommonAlert
    v-if="variant === 'alert'"
    class="select-none"
    size="2xs"
    color="info"
    hide-icon
    :actions="actions"
  >
    <template #description>
      {{ text }}
    </template>
  </CommonAlert>
  <div v-else class="flex flex-col space-y-1">
    <div class="text-body-3xs text-foreground-2 pr-8 select-none">
      Upgrade to view versions older than the {{ versionLimitFormatted }} limit.
    </div>
    <FormButton color="outline" size="sm" @click="handleUpgradeClick">
      Upgrade
    </FormButton>
  </div>
</template>
<script setup lang="ts">
import type { AlertAction } from '@speckle/ui-components'
import { useWorkspaceLimits } from '~/lib/workspaces/composables/limits'
import { settingsWorkspaceRoutes } from '~~/lib/common/helpers/route'
import { useMixpanel } from '~/lib/core/composables/mp'
import type {
  ViewerLimitAlertType,
  ViewerLimitAlertVariant
} from '~/lib/common/helpers/permissions'
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerResourcesWorkspaceLimitAlert_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment ViewerResourcesWorkspaceLimitAlert_Workspace on Workspace {
    id
    slug
  }
`)

const props = withDefaults(
  defineProps<{
    limitType: ViewerLimitAlertType
    variant?: ViewerLimitAlertVariant
    workspace: ViewerResourcesWorkspaceLimitAlert_WorkspaceFragment
  }>(),
  {
    variant: 'alert'
  }
)

const mixpanel = useMixpanel()

const { commentLimitFormatted, versionLimitFormatted } = useWorkspaceLimits({
  slug: computed(() => props.workspace.slug || '')
})

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
      workspace_id: props.workspace.slug
    }
  )
  return navigateTo(settingsWorkspaceRoutes.billing.route(props.workspace.slug))
}
</script>
