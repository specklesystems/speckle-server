<template>
  <WorkspacePlanLimitReachedDialog
    v-model:open="showDialog"
    :title="title"
    :buttons="buttons"
    prevent-close
  >
    <template #header>{{ title }}</template>
    <div class="mb-2">
      <p>{{ message }}</p>
    </div>
  </WorkspacePlanLimitReachedDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { modelRoute, settingsWorkspaceRoutes } from '~/lib/common/helpers/route'

type LimitType = 'version' | 'comment' | 'federated'

const props = defineProps<{
  limitType: LimitType
  workspaceSlug?: string
  projectId: string
  resourceIdString: string
}>()

const showDialog = defineModel<boolean>('open', { required: true })

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
      return "The version you're trying to load is older than the 30-day version history limit allowed by your workspace plan. Upgrade your workspace plan to gain access."
    case 'federated':
      return 'One of the models is older than the 30-day version history limit allowed by your workspace plan. Upgrade your workspace plan to gain access.'
    case 'comment':
      return 'Loading a comment in a federated model view, where one of the models is an old version (= the "Load full context" button)'
    default:
      return "You've reached the limit of your plan. Please upgrade to continue."
  }
})

const loadLatestButton = (isPrimary = true): LayoutDialogButton => ({
  text: 'Load latest version',
  props: {
    color: isPrimary ? 'primary' : 'outline'
  },
  onClick: () => navigateTo(modelRoute(props.projectId, props.resourceIdString))
})

const explorePlansButton: LayoutDialogButton = {
  text: 'Explore plans',
  onClick: () =>
    navigateTo(settingsWorkspaceRoutes.billing.route(props.workspaceSlug || ''))
}

const cancelButton: LayoutDialogButton = {
  text: 'Cancel',
  props: { color: 'outline' },
  onClick: () => {
    showDialog.value = false
  }
}

// Button configurations by limit type
const buttons = computed((): LayoutDialogButton[] => {
  const buttons: Record<LimitType, LayoutDialogButton[]> = {
    version: [loadLatestButton(), explorePlansButton],
    federated: [loadLatestButton(false), explorePlansButton],
    comment: [loadLatestButton()]
  }

  return buttons[props.limitType] || [cancelButton, loadLatestButton()]
})
</script>
