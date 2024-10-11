<template>
  <div>
    <div
      class="flex flex-col gap-y-2 sm:flex-row sm:gap-y-0 sm:gap-x-2 sm:items-center my-2 py-1 px-2 border border-blue-500/10 rounded-md sm:h-12"
    >
      <div class="flex gap-x-2 items-center truncate">
        <div>
          <Component
            :is="statusMetaData.icon"
            v-tippy="functionRun.status"
            :class="['h-5 w-5 outline-none', statusMetaData.iconColor]"
          />
        </div>
        <AutomateFunctionLogo :logo="functionRun.function?.logo" size="xs" />

        <div class="font-medium text-sm truncate">
          {{ automationName ? automationName + ' / ' : ''
          }}{{ functionRun.function?.name || 'Unknown function' }}
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-2 sm:items-center truncate">
        <div class="sm:truncate">
          <div
            v-if="
              [
                AutomateRunStatus.Initializing,
                AutomateRunStatus.Running,
                AutomateRunStatus.Pending
              ].includes(functionRun.status)
            "
            class="text-sm text-foreground-2 italic whitespace-normal sm:truncate"
          >
            Function is {{ functionRun.status.toLowerCase() }}.
          </div>
          <div
            v-else
            class="text-sm text-foreground-2 italic whitespace-normal sm:truncate"
          >
            {{ functionRun.statusMessage }}
          </div>
        </div>
        <div
          class="flex flex-grow text-right flex-shrink-0 bg-pink-300/0 justify-end space-x-2 items-center"
        >
          <div
            v-if="attachments && attachments.length !== 0"
            class="flex space-x-1 shrink items-center"
          >
            <div v-if="attachments.length === 1">
              <AutomateRunsAttachmentButton
                :blob-id="attachments[0]"
                :project-id="projectId"
                size="xs"
              />
            </div>
            <FormButton
              v-if="attachments.length > 1"
              size="sm"
              color="outline"
              class="mt-1"
              @click="showAttachmentDialog = true"
            >
              {{ attachments.length }} attachments
            </FormButton>
            <LayoutDialog
              v-model:open="showAttachmentDialog"
              :title="`${functionRun.function?.name || 'Unknown function'} attachments`"
              max-width="sm"
            >
              <div v-for="id in attachments" :key="id">
                <AutomateRunsAttachmentButton
                  :blob-id="id"
                  :restrict-width="false"
                  :project-id="projectId"
                  size="xs"
                />
              </div>
            </LayoutDialog>
          </div>
          <div class="flex-shrink-0">
            <FormButton
              v-if="functionRun.contextView"
              size="sm"
              :to="functionRun.contextView"
              target="_blank"
            >
              View Results
            </FormButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useRunStatusMetadata } from '~/lib/automate/composables/runStatus'
import { useAutomationFunctionRunResults } from '~/lib/automate/composables/runs'
import { graphql } from '~/lib/common/generated/gql'
import {
  AutomateRunStatus,
  type AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRunFragment
} from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRun on AutomateFunctionRun {
    id
    results
    status
    statusMessage
    contextView
    function {
      id
      logo
      name
    }
    createdAt
    updatedAt
  }
`)

const props = defineProps<{
  functionRun: AutomateRunsTriggerStatusDialogFunctionRun_AutomateFunctionRunFragment
  automationName?: string
  projectId: string
  modelId: string
  versionId?: string
}>()

const { metadata: statusMetaData } = useRunStatusMetadata({
  status: computed(() => props.functionRun.status)
})
const results = useAutomationFunctionRunResults({
  results: computed(() => props.functionRun.results)
})

const showAttachmentDialog = ref(false)

const attachments = computed(() => results.value?.values.blobIds || [])
</script>
