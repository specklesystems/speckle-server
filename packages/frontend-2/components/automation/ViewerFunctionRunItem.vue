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
      <div
        class="bg-blue-500/10 text-primary font-bold h-4 w-4 rounded-md shrink-0 flex justify-center text-center items-center overflow-hidden"
      >
        <img
          v-if="functionRun.functionLogo"
          :src="functionRun.functionLogo"
          alt="function logo"
        />
        <span v-else class="text-xs">λ</span>
      </div>

      <div class="font-bold text-xs truncate">
        {{ automationName ? automationName + ' / ' : '' }}{{ functionRun.functionName }}
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
        <div class="text-xs font-bold text-foreground-2">Status</div>
        <div
          v-if="
            functionRun.status === AutomationRunStatus.Initializing ||
            functionRun.status === AutomationRunStatus.Running
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
      <div
        v-if="attachments.length !== 0"
        class="border-t pt-2 border-foreground-2 space-y-1"
      >
        <div class="text-xs font-bold text-foreground-2">Attachments</div>
        <div class="ml-[2px] justify-start">
          <AutomationAttachmentButton
            v-for="id in attachments"
            :key="id"
            :blob-id="id"
            :project-id="projectId"
            size="xs"
            link
            class="mr-2"
          />
        </div>
      </div>
      <!-- TODO: Overlay result versions -->
      <div
        v-if="typedFunctionRun.resultVersions.length !== 0"
        class="border-t pt-2 border-foreground-2"
      >
        <div class="text-xs font-bold text-foreground-2 mb-2">Resulting Models</div>
        <!-- <div class="text-xs">{{ typedFunctionRun.resultVersions }}</div> -->
        <div v-for="version in typedFunctionRun.resultVersions" :key="version.id">
          <FormButton
            v-if="!hasResource(version)"
            size="xs"
            link
            class="truncate max-w-full"
            @click="loadResultVersion(version)"
          >
            Overlay "{{ version.model.name }}"
          </FormButton>
          <FormButton v-else size="xs" link class="truncate max-w-full" disabled>
            "{{ version.model.name }}" is already overlaid
          </FormButton>
        </div>
      </div>
      <!-- Results -->
      <div
        v-if="
          typedFunctionRun.results &&
          typedFunctionRun.results.values &&
          typedFunctionRun.results.values.objectResults &&
          typedFunctionRun.results.values.objectResults.length !== 0
        "
        class="border-t pt-2 border-foreground-2"
      >
        <div class="text-xs font-bold text-foreground-2 mb-2">Results</div>
        <div class="space-y-1">
          <AutomationViewerResultRowItem
            v-for="(
              result, index
            ) in typedFunctionRun.results.values.objectResults.slice(0, pageRunLimit)"
            :key="index"
            :function-id="typedFunctionRun.functionId"
            :result="result"
          />
          <FormButton
            v-if="pageRunLimit < typedFunctionRun.results.values.objectResults.length"
            size="xs"
            color="card"
            class="w-full"
            @click="pageRunLimit += 10"
          >
            Load more ({{
              typedFunctionRun.results.values.objectResults.length - pageRunLimit
            }}
            hidden results)
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import { AutomationRunStatus } from '~~/lib/common/generated/gql/graphql'
import type {
  AutomationFunctionRun,
  Version
} from '~~/lib/common/generated/gql/graphql'
import { SpeckleViewer } from '@speckle/shared'
import { resolveStatusMetadata } from '~~/lib/automations/helpers/resolveStatusMetadata'
import {
  useInjectedViewerState,
  useInjectedViewerRequestedResources
} from '~~/lib/viewer/composables/setup'

const { projectId } = useInjectedViewerState()
const { items } = useInjectedViewerRequestedResources()

type ObjectResult = {
  category: string
  objectIds: string[]
  message: string | null
  level: 'ERROR' | 'WARNING' | 'INFO'
}

const props = defineProps<{
  functionRun: AutomationFunctionRun
  automationName: string
}>()

const pageRunLimit = ref(5)

const typedFunctionRun = computed(() => {
  return props.functionRun as AutomationFunctionRun & {
    results: { values: { blobIds: string[]; objectResults: ObjectResult[] } }
  }
})

const expanded = ref(false)

const attachments = computed(() => {
  if (
    !typedFunctionRun.value.results ||
    !typedFunctionRun.value.results.values ||
    !typedFunctionRun.value.results.values.blobIds
  )
    return []
  return typedFunctionRun.value.results?.values?.blobIds.filter((b) => !!b)
})

const statusMetaData = resolveStatusMetadata(props.functionRun.status)

const hasResource = (version: Version) => {
  for (const res of items.value) {
    const typedRes = res as unknown as { modelId: string; versionId: string }
    if (typedRes.modelId === version.model.id && typedRes.versionId === version.id)
      return true
  }
  return false
}

const loadResultVersion = async (version: Version) => {
  const modelId = version.model.id
  const versionId = version.id

  await items.update([
    ...items.value,
    ...SpeckleViewer.ViewerRoute.resourceBuilder()
      .addModel(modelId, versionId)
      .toResources()
  ])
}
</script>
