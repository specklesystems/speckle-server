<template>
  <LayoutDialogSection
    border-b
    title="Webhooks"
    :icon="LockClosedIcon"
    :button="{
      text: 'Manage',
      to: projectWebhooksRoute(project.id),
      iconRight: ChevronRightIcon,
      color: 'default'
    }"
  ></LayoutDialogSection>
</template>
<script setup lang="ts">
import { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { LockClosedIcon } from '@heroicons/vue/24/solid'
import { ChevronRightIcon } from '@heroicons/vue/24/outline'
import { projectWebhooksRoute } from '~~/lib/common/helpers/route'
import { LayoutDialogSection } from '@speckle/ui-components'

defineProps<{
  project: ProjectPageTeamDialogFragment
}>()
</script>
