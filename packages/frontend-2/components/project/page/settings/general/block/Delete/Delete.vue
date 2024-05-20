<template>
  <div>
    <ProjectPageSettingsBlock background title="Delete Project" :icon="TrashIcon">
      <p>
        Permanently delete this project and all of its content from the Speckle
        platform. This action is not reversible.
      </p>
      <template #bottom-buttons>
        <FormButton color="danger" @click="showDeleteDialog = true">
          Delete Project
        </FormButton>
      </template>
    </ProjectPageSettingsBlock>
    <ProjectPageSettingsGeneralBlockDeleteDialog
      v-if="project"
      v-model:open="showDeleteDialog"
      :project="project"
    />
  </div>
</template>

<script setup lang="ts">
import { TrashIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~~/lib/common/generated/gql'
import type { ProjectPageSettingsGeneralBlockDelete_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment ProjectPageSettingsGeneralBlockDelete_Project on Project {
    id
    name
    role
    models(limit: 0) {
      totalCount
    }
    commentThreads(limit: 0) {
      totalCount
    }
  }
`)

defineProps<{
  project?: ProjectPageSettingsGeneralBlockDelete_ProjectFragment
}>()

const showDeleteDialog = ref(false)
</script>
