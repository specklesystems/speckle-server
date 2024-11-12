<template>
  <div
    :class="`border border-blue-500/10 rounded-md space-y-2 overflow-hidden ${
      expanded ? 'shadow' : ''
    }`"
  >
    <button
      class="flex space-x-1 items-center max-w-full w-full px-1 py-1 h-8 transition hover:bg-primary-muted"
      @click="expanded = !expanded"
    >
      <div>
        <Component
          :is="statusMetaData.icon"
          v-tippy="functionRun.status"
          :class="['h-4 w-4 outline-none', statusMetaData.iconColor]"
        />
      </div>
      <AutomateFunctionLogo :logo="functionRun.function?.logo" size="xs" />
      <div class="font-medium text-xs truncate">
        {{ automationName ? automationName + ' / ' : ''
        }}{{ functionRun.function?.name || 'Unknown function' }}
      </div>

      <div class="h-full grow flex justify-end">
        <button
          class="hover:bg-primary-muted hover:text-primary flex h-full items-center justify-center rounded"
        >
          <ChevronDownIcon
            :class="`h-3 w-3 transition ${!expanded ? '-rotate-90' : 'rotate-0'}`"
          />
        </button>
      </div>
    </button>
    <div v-if="expanded" class="px-2 pb-2 space-y-4">
      <!-- Status message -->
      <div class="space-y-1">
        <div class="text-xs font-medium text-foreground-2">Status</div>
        <div
          v-if="
            [
              AutomateRunStatus.Initializing,
              AutomateRunStatus.Running,
              AutomateRunStatus.Pending
            ].includes(functionRun.status)
          "
          class="text-xs text-foreground-2 italic"
        >
          Function is {{ functionRun.status.toLowerCase() }}.
        </div>
        <div v-else class="text-xs text-foreground-2 italic">
          {{ functionRun.statusMessage || 'No status message' }}
        </div>
      </div>

      <!-- Attachments -->
      <!-- <div
        v-if="attachments.length !== 0"
        class="border-t pt-2 border-foreground-2 space-y-1"
      >
        <div class="text-xs font-medium text-foreground-2">Attachments</div>
        <div class="ml-[2px] justify-start">
          <AutomateRunsAttachmentButton
            v-for="id in attachments"
            :key="id"
            :blob-id="id"
            :project-id="projectId"
            size="xs"
            link
            class="mr-2"
          />
        </div>
      </div> -->
      <!-- Results -->
      <div
        v-if="!!results?.values.objectResults.length"
        class="border-t pt-2 border-foreground-2"
      >
        <div class="text-xs font-medium text-foreground-2 mb-2">Results</div>
        <div class="space-y-1">
          <AutomateFunctionRunRowObjectResult
            v-for="(result, index) in results.values.objectResults.slice(
              0,
              pageRunLimit
            )"
            :key="index"
            :model-card="modelCard"
            :function-id="functionRun.function?.id"
            :result="result"
          />
          <FormButton
            v-if="pageRunLimit < results.values.objectResults.length"
            size="sm"
            color="outline"
            class="w-full"
            @click="pageRunLimit += 10"
          >
            Load more ({{ results.values.objectResults.length - pageRunLimit }}
            hidden results)
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { AutomateRunStatus } from '~/lib/common/generated/gql/graphql'
import type { AutomateFunctionRunItemFragment } from '~/lib/common/generated/gql/graphql'
import {
  useRunStatusMetadata,
  useAutomationFunctionRunResults
} from '~/lib/automate/runStatus'
import type { IModelCard } from '~/lib/models/card'

const props = defineProps<{
  modelCard: IModelCard
  functionRun: AutomateFunctionRunItemFragment
  automationName: string
}>()

const results = useAutomationFunctionRunResults({
  results: computed(() => props.functionRun.results)
})
const { metadata: statusMetaData } = useRunStatusMetadata({
  status: computed(() => props.functionRun.status)
})

const pageRunLimit = ref(5)
const expanded = ref(false)

// const attachments = computed(() =>
//   (results.value?.values.blobIds || []).filter((b) => !!b)
// )
</script>
