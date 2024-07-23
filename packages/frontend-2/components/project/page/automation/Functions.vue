<template>
  <div class="col-span-1">
    <h2 class="h6 font-medium mb-6">Function</h2>
    <AutomateFunctionCardView v-if="functions.length" vertical>
      <AutomateFunctionCard
        v-for="fn in functions"
        :key="fn.fn.id"
        :fn="fn.fn"
        :is-outdated="isOutdated(fn)"
        show-edit
        @edit="onEdit(fn.fn)"
      />
    </AutomateFunctionCardView>
    <CommonGenericEmptyState
      v-else
      message="No valid functions are associated with this automation"
    />
    <ProjectPageAutomationFunctionSettingsDialog
      v-model:open="dialogOpen"
      :project-id="projectId"
      :automation-id="automation.id"
      :revision-fn="dialogFunction"
      :revision="automation.currentRevision"
    />
  </div>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import type {
  AutomationsFunctionsCard_AutomateFunctionFragment,
  ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunctionFragment,
  ProjectPageAutomationFunctions_AutomationFragment
} from '~/lib/common/generated/gql/graphql'

type EditableFunction = AutomationsFunctionsCard_AutomateFunctionFragment
type EditableFunctionRevision =
  ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunctionFragment

graphql(`
  fragment ProjectPageAutomationFunctions_Automation on Automation {
    id
    currentRevision {
      id
      ...ProjectPageAutomationFunctionSettingsDialog_AutomationRevision
      functions {
        release {
          id
          function {
            id
            ...AutomationsFunctionsCard_AutomateFunction
            releases(limit: 1) {
              items {
                id
              }
            }
          }
        }
        ...ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction
      }
    }
  }
`)

const props = defineProps<{
  projectId: string
  automation: ProjectPageAutomationFunctions_AutomationFragment
}>()

const dialogOpen = ref(false)
const dialogFunction = ref<Optional<EditableFunctionRevision>>()

const functionRevisions = computed(
  () => props.automation.currentRevision?.functions || []
)
const functions = computed(
  () =>
    functionRevisions.value.map((f) => ({
      fn: f.release.function,
      fnReleaseId: f.release.id
    })) || []
)

const onEdit = (fn: EditableFunction) => {
  const fid = fn.id
  const revision = functionRevisions.value.find((f) => f.release.function.id === fid)

  if (revision) {
    dialogOpen.value = true
    dialogFunction.value = revision
  }
}

const isOutdated = (fn: (typeof functions.value)[0]) => {
  const latestRelease = fn.fn.releases.items[0]
  return latestRelease.id !== fn.fnReleaseId
}
</script>
