<template>
  <div @click.stop.prevent>
    <Component
      :is="statusIconAndColor.icon"
      v-tippy="automationStatus.statusMessage"
      :class="['h-6 w-6 outline-none', statusIconAndColor.iconColor]"
      @click="showDialog = true"
    />
    <LayoutDialog
      v-model:open="showDialog"
      :title="`Automation Status for ${displayName}`"
      max-width="lg"
    >
      <div class="flex flex-col space-y-2">
        <div class="inline-flex space-x-2 items-center">
          <strong>Status:</strong>
          <CommonBadge
            rounded
            :color-classes="`text-white ${statusIconAndColor.badgeColor}`"
          >
            {{ automationStatus.status }}
          </CommonBadge>
        </div>
        <div
          v-if="automationStatus.statusMessage"
          class="inline-flex space-x-2 items-start"
        >
          <strong class="shrink-0">Status message:</strong>
          <span class="text-foreground">
            {{ automationStatus.statusMessage }}
          </span>
        </div>

        <LayoutDisclosure
          v-for="run in automationRuns"
          :key="run.id"
          :title="`Automation Run #${run.id}`"
          :color="resolveStatusMetadata(run.status).disclosureColor"
        >
          <div class="flex flex-col space-y-2">
            <div class="flex justify-between items-start">
              <div class="flex flex-col space-y-2">
                <div class="inline-flex space-x-2 items-center">
                  <strong>Status:</strong>
                  <CommonBadge
                    rounded
                    :color-classes="`text-white ${
                      resolveStatusMetadata(run.status).badgeColor
                    }`"
                  >
                    {{ run.status }}
                  </CommonBadge>
                </div>
                <div class="inline-flex space-x-2 items-start">
                  <strong class="shrink-0">Started:</strong>
                  <span v-tippy="absoluteDate(run.createdAt)" class="text-foreground">
                    {{ fromNowDate(run.createdAt) }}
                  </span>
                </div>
              </div>
              <div>
                <FormButton
                  v-if="automateBaseUrl"
                  :to="automationDataPageRoute(automateBaseUrl, run.automationId)"
                  external
                  target="_blank"
                >
                  View automation
                </FormButton>
              </div>
            </div>
            <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <LayoutPanel
                v-for="fnRun in run.functionRuns"
                :key="fnRun.id"
                ring
                panel-classes="bg-foundation-2 py-2 px-4"
                custom-padding
              >
                <div class="flex flex-col space-y-4">
                  <div class="flex justify-between items-center">
                    <span class="italic">Function #{{ fnRun.functionId }}</span>
                    <CommonBadge
                      rounded
                      :color-classes="`text-white ${
                        resolveStatusMetadata(fnRun.status).badgeColor
                      }`"
                    >
                      {{ fnRun.status }}
                    </CommonBadge>
                  </div>
                  <div v-if="fnRun.statusMessage">
                    <strong class="shrink-0">Status message:</strong>
                    <p class="text-foreground">
                      {{ fnRun.statusMessage }}
                    </p>
                  </div>
                  <div
                    v-if="fnRun.contextView || fnRun.resultVersions.length"
                    class="flex space-x-2"
                  >
                    <FormButton
                      v-if="fnRun.contextView"
                      size="sm"
                      :to="fnRun.contextView"
                      target="_blank"
                    >
                      View results
                    </FormButton>
                    <!-- TODO: How do we want to render result versions? -->
                    <FormButton
                      v-if="fnRun.resultVersions.length && false"
                      size="sm"
                      :to="viewResultVersionsRoute(fnRun.resultVersions)"
                      target="_blank"
                    >
                      View new versions
                    </FormButton>
                  </div>
                </div>
              </LayoutPanel>
            </div>
          </div>
        </LayoutDisclosure>
      </div>

      <template #buttons>
        <div class="flex w-full justify-end">
          <FormButton outlined @click="showDialog = false">Close</FormButton>
        </div>
      </template>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import {
  CheckCircleIcon,
  XCircleIcon,
  EllipsisHorizontalCircleIcon,
  ArrowRightCircleIcon
} from '@heroicons/vue/24/solid'
import { SetFullyRequired } from '~~/lib/common/helpers/type'
import { graphql } from '~~/lib/common/generated/gql'
import {
  AutomationRunStatus,
  ModelCardAutomationStatus_ModelFragment,
  ModelCardAutomationStatus_VersionFragment
} from '~~/lib/common/generated/gql/graphql'
import dayjs from 'dayjs'
import { automationDataPageRoute, modelRoute } from '~~/lib/common/helpers/route'
import { SpeckleViewer } from '@speckle/shared'
import { useServerInfo } from '~~/lib/core/composables/server'

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
      createdAt
      status
      functionRuns {
        id
        functionId
        elapsed
        status
        statusMessage
        contextView
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

const { serverInfo } = useServerInfo()

const showDialog = ref(false)

const automationStatus = computed(() => props.modelOrVersion.automationStatus)
const statusIconAndColor = computed(() =>
  resolveStatusMetadata(automationStatus.value.status)
)

const automationRuns = computed(() => automationStatus.value.automationRuns)
const automateBaseUrl = computed(() => serverInfo.value?.automateUrl)
const displayName = computed(() =>
  isModel(props.modelOrVersion)
    ? props.modelOrVersion.displayName
    : `version #${props.modelOrVersion.id}`
)

const resolveStatusMetadata = (
  status: AutomationRunStatus
): {
  icon: typeof CheckCircleIcon
  iconColor: string
  badgeColor: string
  disclosureColor: 'success' | 'warning' | 'danger' | 'default'
} => {
  switch (status) {
    case AutomationRunStatus.Succeeded:
      return {
        icon: CheckCircleIcon,
        iconColor: 'text-success',
        badgeColor: 'bg-success',
        disclosureColor: 'success'
      }
    case AutomationRunStatus.Failed:
      return {
        icon: XCircleIcon,
        iconColor: 'text-danger',
        badgeColor: 'bg-danger',
        disclosureColor: 'danger'
      }
    case AutomationRunStatus.Running:
      return {
        icon: ArrowRightCircleIcon,
        iconColor: 'text-info',
        badgeColor: 'bg-info',
        disclosureColor: 'default'
      }
    case AutomationRunStatus.Initializing:
      return {
        icon: EllipsisHorizontalCircleIcon,
        iconColor: 'text-warning',
        badgeColor: 'bg-warning',
        disclosureColor: 'warning'
      }
  }
}

const fromNowDate = (date: Date | string) => dayjs(date).fromNow()
const absoluteDate = (date: Date | string) =>
  dayjs(date).format('MMMM D, YYYY - hh:mm:ss Z')

const viewResultVersionsRoute = (versions: Array<{ id: string }>) => {
  const modelId = props.modelId
  const versionIds = versions.map((v) => v.id)

  const resourceIdStringBuilder = SpeckleViewer.ViewerRoute.resourceBuilder()
  versionIds.forEach((vId) => resourceIdStringBuilder.addModel(modelId, vId))
  const resourceIdString = resourceIdStringBuilder.toString()
  return modelRoute(props.projectId, resourceIdString)
}
</script>
