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
import { Roles, type MaybeNullOrUndefined } from '@speckle/shared'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { modelRoute, settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'
import { useWorkspaceLimits } from '~/lib/workspaces/composables/limits'

type LimitType = 'version' | 'comment' | 'federated'

const props = defineProps<{
  limitType: LimitType
  workspaceSlug: string
  workspaceRole: MaybeNullOrUndefined<string>
  projectId: string
  resourceIdString: string
  open?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { isEnabled: isEmbedEnabled } = useEmbed()
const { versionLimitFormatted, commentLimitFormatted } = useWorkspaceLimits(
  props.workspaceSlug
)

const dialogOpen = computed({
  get: () => props.open || false,
  set: (value) => emit('update:open', value)
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
      return `One of the models is older than the ${versionLimitFormatted.value}-day version history limit allowed by your workspace plan. Upgrade your workspace plan to gain access.`
    case 'comment':
      return `The comment is older than the ${commentLimitFormatted.value} comment history limit allowed by your workspace plan. Upgrade your workspace plan to gain access.`
    default:
      return "You've reached the limit of your plan. Please upgrade to continue."
  }
})

const stripVersionIds = (resourceIdString: string) => {
  const resources = resourceIdString.split(',')

  // For each resource, remove @versionId if present
  const cleanedResources = resources.map((resource) => {
    const atIndex = resource.indexOf('@')
    return atIndex > -1 ? resource.substring(0, atIndex) : resource
  })

  return cleanedResources.join(',')
}

const loadLatestButton = (isPrimary = true): LayoutDialogButton => ({
  text: 'Load latest version',
  props: {
    color: isPrimary ? 'primary' : 'outline'
  },
  onClick: () => {
    const latestResourceIdString = stripVersionIds(props.resourceIdString)

    // Use the modelRoute but with the cleaned resource string that has no version IDs
    navigateTo(modelRoute(props.projectId, latestResourceIdString))
  }
})

const explorePlansButton: LayoutDialogButton = {
  text: 'Explore plans',
  disabled: props.workspaceRole === Roles.Workspace.Guest,
  disabledMessage: 'As a Guest you cannot access plans and billing',
  onClick: () =>
    navigateTo(settingsWorkspaceRoutes.billing.route(props.workspaceSlug || ''))
}

const buttons = computed((): LayoutDialogButton[] => {
  const buttons: Record<LimitType, LayoutDialogButton[]> = {
    version: [loadLatestButton(false), explorePlansButton],
    federated: [loadLatestButton(false), explorePlansButton],
    comment: [loadLatestButton(true)]
  }

  return buttons[props.limitType]
})
</script>
