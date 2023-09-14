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
      :title="`Automation Status for ${props.model.displayName}`"
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
        <div class="inline-flex space-x-2 items-start">
          <strong class="shrink-0">Status message:</strong>
          <span class="text-foreground">
            {{ automationStatus.statusMessage || '' }}
          </span>
        </div>
        <LayoutDisclosure
          v-for="run in automationRuns"
          :key="run.id"
          :title="`Automation Run #${run.id}`"
          :color="resolveStatusMetadata(run.status).disclosureColor"
        >
          Ayo
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
  ModelCardAutomationStatus_ModelFragment
} from '~~/lib/common/generated/gql/graphql'

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

graphql(`
  fragment ModelCardAutomationStatus_Model on Model {
    id
    displayName
    automationStatus {
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
          elapsed
          status
          statusMessage
          contextView
        }
      }
    }
  }
`)

const props = defineProps<{
  model: SetFullyRequired<ModelCardAutomationStatus_ModelFragment, 'automationStatus'>
}>()

const showDialog = ref(false)

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

const automationStatus = computed(() => props.model.automationStatus)
const statusIconAndColor = computed(() =>
  resolveStatusMetadata(automationStatus.value.status)
)

const automationRuns = computed(() => automationStatus.value.automationRuns)
</script>
