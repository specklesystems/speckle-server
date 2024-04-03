<template>
  <div>
    <ProjectPageSettingsBlock background title="Delete Project">
      <template #logo><TrashIcon class="h-5 w-5" /></template>
      <template #introduction>
        <p class="font-bold mb-1 text-sm">
          Deleting a project is an irreversible action.
        </p>
        <p>
          If you are sure you want to proceed, click the button below to begin deletion.
        </p>
      </template>
      <div class="flex justify-end w-full">
        <div class="max-w-max">
          <FormButton color="danger" outlined @click="showDeleteDialog = true">
            Delete Project
          </FormButton>
        </div>
      </div>
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
import type { ProjectSettingsGeneralQuery } from '~~/lib/common/generated/gql/graphql'
type ProjectType = ProjectSettingsGeneralQuery['project']

defineProps<{
  project?: ProjectType
}>()

const showDeleteDialog = ref(false)
</script>
