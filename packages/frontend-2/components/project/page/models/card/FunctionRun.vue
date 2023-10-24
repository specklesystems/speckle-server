<template>
  <div>
    <div
      class="flex space-x-2 items-center my-2 py-1 px-2 border border-blue-500/10 rounded-md h-12"
    >
      <div>
        <Component
          :is="statusMetaData.icon"
          v-tippy="functionRun.status"
          :class="['h-5 w-5 outline-none', statusMetaData.iconColor]"
        />
      </div>
      <div
        class="bg-blue-500/10 text-primary font-bold h-4 w-4 rounded-md shrink-0 flex justify-center text-center items-center overflow-hidden"
      >
        <img v-if="functionRun.logo" :src="functionRun.logo" alt="function logo" />
        <span v-else class="text-xs">λ</span>
      </div>

      <div class="font-bold text-sm truncate">
        {{ automationName ? automationName + ' / ' : ''
        }}{{ functionRun.functionName || 'Majestic ' + functionRun.functionId }}
      </div>
      <div
        v-if="
          functionRun.status === AutomationRunStatus.Initializing ||
          functionRun.status === AutomationRunStatus.Running
        "
        class="text-sm text-foreground-2 italic truncate"
      >
        Function is {{ functionRun.status.toLowerCase() }}.
      </div>
      <div v-else class="text-sm text-foreground-2 italic truncate">
        {{ functionRun.statusMessage }}
      </div>
      <div
        class="flex flex-grow text-right flex-shrink-0 bg-pink-300/0 justify-end space-x-2 items-center"
      >
        <div v-if="attachments && attachments.length !== 0" class="flex space-x-1">
          <ProjectPageModelsCardAutomationRunAttachmentButton
            v-for="id in attachments"
            :key="id"
            :blob-id="id"
          />
        </div>
        <FormButton
          v-if="functionRun.contextView"
          size="xs"
          :to="functionRun.contextView"
          target="_blank"
        >
          View Results
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  AutomationFunctionRun,
  AutomationRunStatus
} from '~~/lib/common/generated/gql/graphql'
import { resolveStatusMetadata } from '~~/lib/automations/helpers/resolveStatusMetadata'

const props = defineProps<{
  automationName?: string
  functionRun: AutomationFunctionRun & {
    logo?: string // NOTE: this is a backend TODO
    functionName?: string // NOTE: this is a backend TODO
    results: { values: { blobIds: string[] } }
  }
}>()

const attachments = computed(() => props.functionRun.results?.values?.blobIds || [])

const statusMetaData = resolveStatusMetadata(props.functionRun.status)
</script>
