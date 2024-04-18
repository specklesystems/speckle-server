<template>
  <LayoutDialog
    v-model:open="open"
    max-width="lg"
    title="Create Automation"
    :buttons-wrapper-classes="buttonsWrapperClasses"
    :buttons="buttons"
  >
    <div class="flex flex-col gap-11">
      <CommonStepsNumber
        v-if="shouldShowStepsWidget"
        v-model="stepsWidgetModel"
        :steps="stepsWidgetSteps"
        non-interactive
      />
      <AutomateAutomationCreateDialogSelectFunctionStep
        v-if="enumStep === AutomationCreateSteps.SelectFunction"
        v-model:selected-function-id="selectedFunctionId"
      />
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { useEnumSteps, useEnumStepsWidgetSetup } from '~/lib/form/composables/steps'
import { CommonStepsNumber, type LayoutDialogButton } from '@speckle/ui-components'
import { ChevronRightIcon } from '@heroicons/vue/24/outline'

enum AutomationCreateSteps {
  SelectFunction,
  FunctionParameters,
  AutomationDetails,
  Done
}

const open = defineModel<boolean>('open', { required: true })
const selectedFunctionId = defineModel<string | undefined>('selectedFunctionId')
const projectId = defineModel<string | undefined>('projectId')

const stepsOrder = computed(() => [
  AutomationCreateSteps.SelectFunction,
  AutomationCreateSteps.FunctionParameters,
  AutomationCreateSteps.AutomationDetails,
  AutomationCreateSteps.Done
])

const stepsWidgetData = computed(() => [
  {
    step: AutomationCreateSteps.SelectFunction,
    title: 'Select Function'
  },
  {
    step: AutomationCreateSteps.FunctionParameters,
    title: 'Set Parameters'
  },
  {
    step: AutomationCreateSteps.AutomationDetails,
    title: 'Add Details'
  }
])

const { enumStep, step } = useEnumSteps({ order: stepsOrder })
const {
  items: stepsWidgetSteps,
  model: stepsWidgetModel,
  shouldShowWidget: shouldShowStepsWidget
} = useEnumStepsWidgetSetup({ enumStep, widgetStepsMap: stepsWidgetData })

const buttons = computed((): LayoutDialogButton[] => {
  switch (enumStep.value) {
    case AutomationCreateSteps.SelectFunction:
      return [
        {
          text: 'Next',
          props: {
            iconRight: ChevronRightIcon,
            disabled: !selectedFunctionId.value
          },
          onClick: () => {
            step.value++
          }
        }
      ]
    default:
      return []
  }
})

const buttonsWrapperClasses = computed(() => {
  switch (enumStep.value) {
    case AutomationCreateSteps.SelectFunction:
      return 'justify-end'
    default:
      return 'justify-between'
  }
})

const reset = () => {
  step.value = 0
}

watch(open, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    reset()
  }
})
</script>
