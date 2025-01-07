<template>
  <div>
    <ProjectPageSettingsBlock background title="Delete project">
      <div
        class="rounded border bg-foundation-page border-outline-3 text-body-xs text-foreground py-4 px-6"
      >
        Permanently delete this project and all of its content from the Speckle
        platform. This action is not reversible.
      </div>
      <template #bottom-buttons>
        <FormButton color="danger" @click="showDeleteDialog = true">
          Delete project
        </FormButton>
      </template>
    </ProjectPageSettingsBlock>
    <ProjectsDeleteDialog
      v-if="project"
      v-model:open="showDeleteDialog"
      redirect-on-complete
      :project="project"
    />
  </div>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectsDeleteDialog_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageSettingsGeneralBlockDelete_Project on Project {
    ...ProjectsDeleteDialog_Project
  }
`)

defineProps<{
  project?: ProjectsDeleteDialog_ProjectFragment
}>()

const showDeleteDialog = ref(false)
</script>
