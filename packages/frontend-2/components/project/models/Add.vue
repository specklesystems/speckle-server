<template>
  <div>
    <template v-if="project">
      <ProjectPageModelsNewDialog
        v-model:open="openNewModelDialog"
        :project-id="project.id"
        :parent-model-name="parentModelName"
      />
      <WorkspacePlanProjectModelLimitReachedDialog
        v-model:open="openWorkspaceLimitsHit"
        :workspace-name="project.workspace?.name"
        :plan="project.workspace?.plan?.name"
        :workspace-role="project.workspace?.role"
        :workspace-slug="project.workspace?.slug || ''"
        location="models"
        type="model"
      />
    </template>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { WorkspaceLimitsReachedError } from '@speckle/shared/authz'
import { graphql } from '~/lib/common/generated/gql'
import type { ProjectModelsAdd_ProjectFragment } from '~/lib/common/generated/gql/graphql'
import { useCanCreateModel } from '~/lib/projects/composables/permissions'

graphql(`
  fragment ProjectModelsAdd_Project on Project {
    id
    workspace {
      name
      slug
      role
      plan {
        name
      }
    }
    ...UseCanCreateModel_Project
  }
`)
const props = defineProps<{
  project: MaybeNullOrUndefined<ProjectModelsAdd_ProjectFragment>
  /**
   * If creating a nested model, specify the prefix of the parent model here as it will be prefixed
   * to whatever the user enters.
   * E.g. if creating a model under "a/b", then put "a/b" here
   */
  parentModelName?: string
}>()
const open = defineModel<boolean>('open', { required: true })

const canCreateModel = useCanCreateModel({
  project: computed(() => props.project)
})

const openNewModelDialog = computed({
  get: () => {
    if (!canCreateModel.canActuallyCreate.value) return false
    return open.value
  },
  set: (newVal) => {
    if (!canCreateModel.canActuallyCreate.value) return false
    open.value = newVal
  }
})

const openWorkspaceLimitsHit = computed({
  get: () => {
    if (canCreateModel.cantClickCreateCode.value !== WorkspaceLimitsReachedError.code)
      return false

    return open.value
  },
  set: (value) => {
    if (canCreateModel.cantClickCreateCode.value !== WorkspaceLimitsReachedError.code)
      return false

    open.value = value
  }
})
</script>
