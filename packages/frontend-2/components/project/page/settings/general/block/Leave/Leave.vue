<template>
  <div>
    <ProjectPageSettingsBlock
      background
      title="Leave Project"
      :icon="ArrowRightOnRectangleIcon"
    >
      <template #introduction>
        <p>
          As long as you're not the only owner you can remove yourself from this
          project's list of collaborators.
        </p>
        <p class="font-bold my-2 text-sm">
          Removing yourself from the collaborators list is an irreversible action.
        </p>
        <p>
          If you are sure you want to proceed, click the button below to begin deletion.
        </p>
      </template>
      <div class="flex justify-end w-full">
        <div class="max-w-max">
          <FormButton color="info" outlined @click="showDeleteDialog = true">
            Leave Project
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
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import type { ProjectSettingsGeneralQuery } from '~~/lib/common/generated/gql/graphql'
type ProjectType = ProjectSettingsGeneralQuery['project']

defineProps<{
  project?: ProjectType
}>()

const showDeleteDialog = ref(false)
</script>
