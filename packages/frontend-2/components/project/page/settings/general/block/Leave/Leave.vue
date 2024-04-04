<template>
  <div>
    <ProjectPageSettingsBlock
      background
      title="Leave Project"
      :icon="ArrowRightOnRectangleIcon"
    >
      <template #introduction>
        <p class="font-bold mb-2 text-sm">
          Removing yourself from the collaborators list is an irreversible action.
        </p>
        <p>
          If you are sure you want to proceed, click the button below to begin deletion.
        </p>
      </template>
      <div class="flex justify-end w-full">
        <div class="max-w-max">
          <FormButton color="danger" outlined @click="showLeaveDialog = true">
            Leave Project
          </FormButton>
        </div>
      </div>
    </ProjectPageSettingsBlock>
    <ProjectPageSettingsGeneralBlockLeaveDialog
      v-if="project"
      v-model:open="showLeaveDialog"
      :project="project"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import type { ProjectSettingsQuery } from '~~/lib/common/generated/gql/graphql'

defineProps<{
  project?: ProjectSettingsQuery['project']
}>()

const showLeaveDialog = ref(false)
</script>
