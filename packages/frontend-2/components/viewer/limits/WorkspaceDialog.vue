<template>
  <WorkspacePlanLimitReachedDialog
    v-model:open="dialogOpen"
    :buttons="buttons"
    prevent-close
    :condensed="isEmbedEnabled || undefined"
  >
    <template #header>{{ title }}</template>
    <div class="mb-2">
      <p>{{ message }}</p>
    </div>
  </WorkspacePlanLimitReachedDialog>
</template>
<script setup lang="ts">
import { Roles } from '@speckle/shared'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { useWorkspaceLimits } from '~/lib/workspaces/composables/limits'
import { useMixpanel } from '~/lib/core/composables/mp'
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerLimitsWorkspaceDialog_ProjectFragment } from '~/lib/common/generated/gql/graphql'
import type { ViewerLimitsDialogType } from '~/lib/projects/helpers/limits'
import { useLoadLatestVersion } from '~/lib/viewer/composables/resources'

graphql(`
  fragment ViewerLimitsWorkspaceDialog_Project on Project {
    id
    workspace {
      id
      role
      slug
      ...WorkspacePlanLimits_Workspace
    }
    ...UseLoadLatestVersion_Project
  }
`)

const props = defineProps<{
  limitType: ViewerLimitsDialogType
  project: ViewerLimitsWorkspaceDialog_ProjectFragment
  resourceIdString: string
}>()

const dialogOpen = defineModel<boolean>('open', {
  required: true
})

const mixpanel = useMixpanel()
const { isEnabled: isEmbedEnabled } = useEmbed()
const { versionLimitFormatted } = useWorkspaceLimits({
  slug: computed(() => props.project.workspace?.slug),
  workspace: computed(() => props.project.workspace)
})

const { createButton: loadLatestButton } = useLoadLatestVersion({
  project: computed(() => props.project),
  resourceIdString: computed(() => props.resourceIdString)
})

const title = computed(() => {
  switch (props.limitType) {
    case 'version':
      return 'Plan limit reached'
    case 'federated':
      return "The federated models couldn't be loaded"
    case 'comment':
      return 'The comment could not be loaded'
    default:
      return 'Plan limit reached'
  }
})

const message = computed(() => {
  switch (props.limitType) {
    case 'version':
      return `The version you're trying to load is older than the ${versionLimitFormatted.value} version history limit allowed by your workspace plan. Upgrade your workspace plan to gain access.`
    case 'federated':
      return `One of the models is older than the ${versionLimitFormatted.value} version history limit allowed by your workspace plan. Upgrade your workspace plan to gain access.`
    case 'comment':
      return `Unable to load the comment because one or more of the referenced models is older than the ${versionLimitFormatted.value} version history limit. Upgrade your workspace plan to gain access.`
    default:
      return "You've reached the limit of your plan. Please upgrade to continue."
  }
})

const explorePlansButton: LayoutDialogButton = {
  text: 'Explore plans',
  disabled: props.project.workspace?.role === Roles.Workspace.Guest,
  disabledMessage: 'As a Guest you cannot access plans and billing',
  onClick: () => {
    const slug = props.project.workspace?.slug
    if (!slug) return

    mixpanel.track('Limit Reached Dialog Upgrade Button Clicked', {
      type: props.limitType === 'version' ? 'version' : 'model',
      location: 'viewer',
      // eslint-disable-next-line camelcase
      workspace_id: slug
    })
    return navigateTo(settingsWorkspaceRoutes.billing.route(slug))
  }
}

const buttons = computed((): LayoutDialogButton[] => {
  const buttons: Record<ViewerLimitsDialogType, LayoutDialogButton[]> = {
    version: isEmbedEnabled.value
      ? [loadLatestButton(false)]
      : [loadLatestButton(false), explorePlansButton],
    federated: isEmbedEnabled.value
      ? [loadLatestButton(false)]
      : [loadLatestButton(false), explorePlansButton],
    comment: [loadLatestButton(true)]
  }

  return buttons[props.limitType]
})
</script>
