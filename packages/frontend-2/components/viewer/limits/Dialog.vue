<template>
  <WorkspacePlanLimitReachedDialog
    v-model:open="showDialog"
    :title="title"
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
import type { LayoutDialogButton } from '@speckle/ui-components'
import { modelRoute, settingsWorkspaceRoutes } from '~/lib/common/helpers/route'
import { useEmbed } from '~/lib/viewer/composables/setup/embed'

type LimitType = 'version' | 'comment' | 'federated'

const props = defineProps<{
  limitType: LimitType
  workspaceSlug?: string
  projectId: string
  resourceIdString: string
}>()

const { isEnabled: isEmbedEnabled } = useEmbed()

const showDialog = computed(() => {
  return false
})

const limitDays = computed(() => {
  return 30
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
      return `The version you're trying to load is older than the ${limitDays.value}-day version history limit allowed by your workspace plan. Upgrade your workspace plan to gain access.`
    case 'federated':
      return `One of the models is older than the ${limitDays.value}-day version history limit allowed by your workspace plan. Upgrade your workspace plan to gain access.`
    case 'comment':
      return 'Loading a comment in a federated model view, where one of the models is an old version'
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

const buttons = computed((): LayoutDialogButton[] => {
  const buttons: Record<LimitType, LayoutDialogButton[]> = {
    version: [loadLatestButton(false), explorePlansButton],
    federated: [loadLatestButton(false), explorePlansButton],
    comment: [loadLatestButton(true)]
  }

  return buttons[props.limitType]
})
</script>
