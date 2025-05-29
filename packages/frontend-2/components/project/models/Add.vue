<template>
  <div>
    <template v-if="project">
      <ProjectPageModelsNewDialog
        v-model:open="openDefault"
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
      <WorkspaceMoveProject
        v-model:open="openPersonalProjectsLimited"
        :project="project"
        location="add_model"
        show-intro
        @done="open = false"
      />
    </template>
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import {
  PersonalProjectsLimitedError,
  WorkspaceLimitsReachedError
} from '@speckle/shared/authz'
import { useMultipleDialogBranching } from '~/lib/common/composables/dialog'
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
    ...WorkspaceMoveProject_Project
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

const { openDefault, openWorkspaceLimitsHit, openPersonalProjectsLimited } =
  useMultipleDialogBranching({
    open,
    conditions: {
      workspaceLimitsHit: computed(
        () =>
          canCreateModel.cantClickCreateCode.value === WorkspaceLimitsReachedError.code
      ),
      personalProjectsLimited: computed(
        () =>
          canCreateModel.cantClickCreateCode.value === PersonalProjectsLimitedError.code
      )
    }
  })
</script>
