<template>
  <div class="flex flex-col">
    <h2 class="h6 font-bold">Function</h2>
    <div class="text-foreground-2">
      Note: functions do not automatically update to their latest release. To do so,
      please select it manually via the edit dialog.
    </div>
    <AutomateFunctionCardView class="mt-2">
      <AutomateFunctionCard
        v-for="fn in functions"
        :key="fn.id"
        :fn="fn"
        show-edit
        @edit="onEdit(fn)"
      />
    </AutomateFunctionCardView>
    <ProjectPageAutomationFunctionSettingsDialog
      v-model:open="dialogOpen"
      :project-id="projectId"
      :automation-id="automation.id"
      :revision-fn="dialogFunction"
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

// TODO: Edit details dialog

type EditableFunction = AutomationsFunctionsCard_AutomateFunctionFragment
type EditableFunctionRevision =
  ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunctionFragment

graphql(`
  fragment ProjectPageAutomationFunctions_Automation on Automation {
    id
    currentRevision {
      id
      functions {
        release {
          id
          function {
            id
            ...AutomationsFunctionsCard_AutomateFunction
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
  () => functionRevisions.value.map((f) => f.release.function) || []
)

const onEdit = (fn: EditableFunction) => {
  const fid = fn.id
  const revision = functionRevisions.value.find((f) => f.release.function.id === fid)

  if (revision) {
    dialogOpen.value = true
    dialogFunction.value = revision
  }
}
</script>
