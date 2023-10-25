<template>
  <div v-if="allFunctionRuns.length > 0" @click.stop.prevent>
    <button
      v-tippy="summary.longSummary"
      class="h-6 w-6 bg-foundation rounded-full flex items-center justify-center"
      @click="showDialog = true"
    >
      <!-- <Component
        :is="statusIconAndColor.icon"
        v-tippy="automationStatus.statusMessage"
        :class="['h-6 w-6 outline-none', statusIconAndColor.iconColor]"
      /> -->
      <AutomationDoughnutSummary :summary="summary" />
    </button>
    <LayoutDialog
      v-model:open="showDialog"
      :title="`Automation Status for ${displayName}`"
      max-width="lg"
    >
      <template #header>
        <div class="flex items-center space-x-2 -mt-1 max-w-full w-full">
          <div class="h-10 w-10 mt-[6px]">
            <AutomationDoughnutSummary :summary="summary" />
          </div>
          <div class="min-w-0">
            <h4 :class="`text-xl font-bold ${summary.titleColor}`">
              {{ summary.title }}
            </h4>
            <div class="text-xs text-foreground-2 truncate">
              {{ summary.longSummary }}
            </div>
          </div>
        </div>
      </template>
      <div class="">
        <div v-for="run in automationRuns" :key="run.id">
          <ProjectPageModelsCardAutomationRun :run="(run as AutomationRun)" />
        </div>
      </div>

      <template #buttons>
        <div class="flex w-full justify-between items-center pl-2">
          <FormButton text size="xs" to="https://automate.speckle.dev" target="_blank">
            Learn more about Automate here!
          </FormButton>
          <FormButton @click="showDialog = false">Close</FormButton>
        </div>
      </template>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { SetFullyRequired } from '~~/lib/common/helpers/type'
import { graphql } from '~~/lib/common/generated/gql'
import {
  AutomationFunctionRun,
  AutomationRun,
  AutomationRunStatus,
  ModelCardAutomationStatus_ModelFragment,
  ModelCardAutomationStatus_VersionFragment
} from '~~/lib/common/generated/gql/graphql'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import dayjs from 'dayjs'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { automationDataPageRoute, modelRoute } from '~~/lib/common/helpers/route'
import { SpeckleViewer } from '@speckle/shared'
import { useServerInfo } from '~~/lib/core/composables/server'
import { resolveStatusMetadata } from '~~/lib/automations/helpers/resolveStatusMetadata'
import { useModelVersionCardAutomationsStatusUpdateTracking } from '~~/lib/automations/composables/automationsStatus'

// TODO: Clean up unnecessary fields
// Remember about stories

/**
 * - Show checkmark/red cross
 * - On hover show global status msg
 * - On click: show modal w/ more specific info about version and its runs
 *
 * VERSION CARD:
 * - Same essentially
 *
 * VIEWER:
 * - Where to show per-object info? In object explorer cards?
 */

type Model = SetFullyRequired<
  ModelCardAutomationStatus_ModelFragment,
  'automationStatus'
>
type Version = SetFullyRequired<
  ModelCardAutomationStatus_VersionFragment,
  'automationStatus'
>

const isModel = (val: Model | Version): val is Model => 'displayName' in val

graphql(`
  fragment ModelCardAutomationStatus_AutomationsStatus on AutomationsStatus {
    id
    status
    statusMessage
    automationRuns {
      id
      automationId
      automationName
      createdAt
      status
      functionRuns {
        id
        functionId
        functionName
        functionLogo
        elapsed
        status
        statusMessage
        contextView
        results
        resultVersions {
          id
        }
      }
    }
  }
`)

graphql(`
  fragment ModelCardAutomationStatus_Model on Model {
    id
    displayName
    automationStatus {
      ...ModelCardAutomationStatus_AutomationsStatus
    }
  }
`)

graphql(`
  fragment ModelCardAutomationStatus_Version on Version {
    id
    automationStatus {
      ...ModelCardAutomationStatus_AutomationsStatus
    }
  }
`)

const props = defineProps<{
  modelOrVersion: Model | Version
  projectId: string
  modelId: string
}>()

useModelVersionCardAutomationsStatusUpdateTracking(props.projectId)

const { serverInfo } = useServerInfo()

const showDialog = ref(false)

const automationStatus = computed(() => props.modelOrVersion.automationStatus)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const statusIconAndColor = computed(() =>
  resolveStatusMetadata(automationStatus.value.status)
)

const automationRuns = computed(() => automationStatus.value.automationRuns)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const automateBaseUrl = computed(() => serverInfo.value?.automateUrl)
const displayName = computed(() =>
  isModel(props.modelOrVersion)
    ? props.modelOrVersion.displayName
    : `version #${props.modelOrVersion.id}`
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const viewResultVersionsRoute = (versions: Array<{ id: string }>) => {
  const modelId = props.modelId
  const versionIds = versions.map((v) => v.id)

  const resourceIdStringBuilder = SpeckleViewer.ViewerRoute.resourceBuilder()
  versionIds.forEach((vId) => resourceIdStringBuilder.addModel(modelId, vId))
  const resourceIdString = resourceIdStringBuilder.toString()
  return modelRoute(props.projectId, resourceIdString)
}

const allFunctionRuns = computed(() => {
  const allRuns: AutomationFunctionRun[] = [] // as AutomationFunctionRun[]
  if (!props.modelOrVersion.automationStatus) return allRuns
  for (const myRun of props.modelOrVersion.automationStatus.automationRuns) {
    allRuns.push(...(myRun.functionRuns as AutomationFunctionRun[]))
  }
  return allRuns
})

const summary = computed(() => {
  const result = {
    failed: 0,
    passed: 0,
    inProgress: 0,
    total: allFunctionRuns.value.length,
    title: 'All runs passed.',
    titleColor: 'text-success',
    longSummary: ''
  }

  for (const run of allFunctionRuns.value) {
    switch (run.status) {
      case AutomationRunStatus.Succeeded:
        result.passed++
        break
      case AutomationRunStatus.Failed:
        result.title = 'Some runs failed.'
        result.titleColor = 'text-danger'
        result.failed++
        break
      default:
        if (result.failed === 0) {
          result.title = 'Some runs are still in progress.'
          result.titleColor = 'text-warning'
        }
        result.inProgress++
        break
    }
  }

  // format:
  // 2 failed, 1 passed runs
  // 1 passed, 2 in progress, 1 failed runs
  // 1 passed run
  const longSummarySegments = []
  if (result.passed > 0) longSummarySegments.push(`${result.passed} passed`)
  if (result.inProgress > 0)
    longSummarySegments.push(`${result.inProgress} in progress`)
  if (result.failed > 0) longSummarySegments.push(`${result.failed} failed`)

  result.longSummary = (
    longSummarySegments.join(', ') + ` run${result.total > 1 ? 's' : ''}.`
  ).replace(/,(?=[^,]+$)/, ', and')

  return result
})
</script>
