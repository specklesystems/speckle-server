<template>
  <ViewerResourcesPersonalLimitAlert
    v-if="isPersonalLimit"
    :limit-type="limitType"
    :variant="variant"
    :project="project"
  />
  <ViewerResourcesUpgradeLimitAlert
    v-else-if="project?.workspace"
    :limit-type="limitType"
    :variant="variant"
    :workspace="project.workspace"
  />
  <div v-else />
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerResourcesLimitAlert_ProjectFragment } from '~/lib/common/generated/gql/graphql'
import type {
  ViewerLimitAlertType,
  ViewerLimitAlertVariant
} from '~/lib/common/helpers/permissions'

graphql(`
  fragment ViewerResourcesLimitAlert_Project on Project {
    id
    workspaceId
    workspace {
      id
      slug
      ...ViewerResourcesWorkspaceLimitAlert_Workspace
    }
    ...WorkspaceMoveProject_Project
  }
`)

const props = withDefaults(
  defineProps<{
    limitType: ViewerLimitAlertType
    variant?: ViewerLimitAlertVariant
    project: MaybeNullOrUndefined<ViewerResourcesLimitAlert_ProjectFragment>
  }>(),
  {
    variant: 'alert'
  }
)

const isPersonalLimit = computed(() => props.project && !props.project.workspaceId)
</script>
