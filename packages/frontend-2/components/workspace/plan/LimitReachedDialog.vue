<template>
  <LayoutDialog v-model:open="isOpen" max-width="md">
    <template #header>Leave project</template>
    <div>Content</div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { Nullable } from '@speckle/shared'
import { LayoutDialog } from '@speckle/ui-components'
import type { ProjectsMoveToWorkspaceDialog_ProjectFragment } from '~/lib/common/generated/gql/graphql'

const isOpen = defineModel<boolean>('open', { required: true })

defineProps<{
  project: Nullable<ProjectsMoveToWorkspaceDialog_ProjectFragment>
}>()
</script>
