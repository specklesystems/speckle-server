<template>
  <div>
    <div
      class="flex space-x-2 items-center my-2 py-1 px-2 border border-blue-500/10 rounded-md h-12 overflow-y-auto simple-scrollbar"
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
        <img
          v-if="functionRun.functionLogo"
          :src="functionRun.functionLogo"
          alt="function logo"
        />
        <span v-else class="text-xs">λ</span>
      </div>

      <div class="font-bold text-sm truncate">
        {{ automationName ? automationName + ' / ' : '' }}{{ functionRun.functionName }}
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
        <div
          v-if="attachments && attachments.length !== 0"
          class="flex space-x-1 shrink items-center"
        >
          <div v-if="attachments.length === 1">
            <AutomationAttachmentButton
              v-for="id in attachments.slice(0, 1)"
              :key="id"
              :blob-id="id"
              :project-id="projectId"
              size="xs"
            />
          </div>
          <FormButton
            v-if="attachments.length > 1"
            size="xs"
            color="card"
            @click="showAttachmentDialog = true"
            class="mt-1"
          >
            {{ attachments.length }} attachments
          </FormButton>
          <LayoutDialog
            v-model:open="showAttachmentDialog"
            :title="`${functionRun.functionName} attachments`"
            max-width="sm"
          >
            <div v-for="id in attachments" :key="id">
              <AutomationAttachmentButton
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
            v-if="functionRun.resultVersions.length > 0"
            size="xs"
            :to="coalescedRunResult"
            target="_blank"
          >
            View Results
          </FormButton>
          <FormButton
            v-else-if="functionRun.contextView"
            size="xs"
            :to="functionRun.contextView"
            target="_blank"
          >
            View Results
          </FormButton>
        </div>
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
    results: { values: { blobIds: string[] } }
  }
  projectId: string
  modelId: string
  versionId?: string
}>()

const attachments = computed(() => props.functionRun.results?.values?.blobIds || [])

const statusMetaData = resolveStatusMetadata(props.functionRun.status)

const showAttachmentDialog = ref(false)

const coalescedRunResult = computed(() => {
  const isVersion = !!props.versionId
  let url = `/projects/${props.projectId}/models/${props.modelId}`
  if (isVersion) url += `@${props.versionId}`
  for (const res of props.functionRun.resultVersions) {
    const modelId = res.model.id
    const versionId = res.id
    url += `,${modelId}@${versionId}`
  }
  return url
})
</script>
