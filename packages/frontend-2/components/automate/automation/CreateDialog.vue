<template>
  <LayoutDialog
    v-model:open="open"
    max-width="lg"
    title="Create Automation"
    :buttons-wrapper-classes="buttonsWrapperClasses"
    :buttons="buttons"
    :on-submit="onDialogSubmit"
    prevent-close-on-click-outside
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
        v-model:selected-function="selectedFunction"
        :preselected-function="preselectedFunction"
      />
      <AutomateAutomationCreateDialogFunctionParametersStep
        v-else-if="
          enumStep === AutomationCreateSteps.FunctionParameters && selectedFunction
        "
        v-model:parameters="functionParameters"
        v-model:has-errors="hasParameterErrors"
        :fn="selectedFunction"
      />
      <AutomateAutomationCreateDialogAutomationDetailsStep
        v-else-if="enumStep === AutomationCreateSteps.AutomationDetails"
        v-model:project="selectedProject"
        v-model:model="selectedModel"
        v-model:automation-name="automationName"
        :preselected-project="preselectedProject"
      />
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { useEnumSteps, useEnumStepsWidgetSetup } from '~/lib/form/composables/steps'
import { CommonStepsNumber, type LayoutDialogButton } from '@speckle/ui-components'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import type { Optional } from '@speckle/shared'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'
import type {
  FormSelectModels_ModelFragment,
  FormSelectProjects_ProjectFragment
} from '~/lib/common/generated/gql/graphql'
import { useForm } from 'vee-validate'

enum AutomationCreateSteps {
  SelectFunction,
  FunctionParameters,
  AutomationDetails,
  Done
}

type DetailsFormValues = {
  project: FormSelectProjects_ProjectFragment
  model: FormSelectModels_ModelFragment
  automationName: string
}

graphql(`
  fragment AutomateAutomationCreateDialog_AutomateFunction on AutomateFunction {
    id
    ...AutomationsFunctionsCard_AutomateFunction
    ...AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction
  }
`)

const props = defineProps<{
  preselectedFunction?: Optional<CreateAutomationSelectableFunction>
  preselectedProject?: Optional<FormSelectProjects_ProjectFragment>
}>()
const open = defineModel<boolean>('open', { required: true })
const { handleSubmit: handleDetailsSubmit } = useForm<DetailsFormValues>()

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

const logger = useLogger()
const { enumStep, step } = useEnumSteps({ order: stepsOrder })
const {
  items: stepsWidgetSteps,
  model: stepsWidgetModel,
  shouldShowWidget: shouldShowStepsWidget
} = useEnumStepsWidgetSetup({ enumStep, widgetStepsMap: stepsWidgetData })

const automationName = ref<string>()
const selectedProject = ref<FormSelectProjects_ProjectFragment>()
const selectedModel = ref<FormSelectModels_ModelFragment>()
const selectedFunction = ref<Optional<CreateAutomationSelectableFunction>>()
const functionParameters = ref<Record<string, unknown>>()
const hasParameterErrors = ref(false)

const buttons = computed((): LayoutDialogButton[] => {
  switch (enumStep.value) {
    case AutomationCreateSteps.SelectFunction:
      return [
        {
          text: 'Next',
          props: {
            iconRight: ChevronRightIcon,
            disabled: !selectedFunction.value
          },
          onClick: () => {
            step.value++
          }
        }
      ]
    case AutomationCreateSteps.FunctionParameters:
      return [
        {
          text: 'Previous',
          props: {
            color: 'secondary',
            iconLeft: ChevronLeftIcon,
            textColor: 'primary'
          },
          onClick: () => step.value--
        },
        {
          text: 'Next',
          props: {
            iconRight: ChevronRightIcon,
            disabled: hasParameterErrors.value
          },
          onClick: () => step.value++
        }
      ]
    case AutomationCreateSteps.AutomationDetails:
      return [
        {
          text: 'Previous',
          props: {
            color: 'secondary',
            iconLeft: ChevronLeftIcon,
            textColor: 'primary'
          },
          onClick: () => step.value--
        },
        {
          text: 'Create',
          submit: true
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
  selectedFunction.value = undefined
  functionParameters.value = undefined
  hasParameterErrors.value = false
  selectedProject.value = undefined
  selectedModel.value = undefined
  automationName.value = undefined
}

const onDetailsSubmit = handleDetailsSubmit(async () => {
  // TODO: Submit
})

const onDialogSubmit = (e: SubmitEvent) => {
  if (enumStep.value !== AutomationCreateSteps.AutomationDetails) return
  onDetailsSubmit(e)
}

watch(
  open,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      reset()

      if (props.preselectedFunction) {
        selectedFunction.value = props.preselectedFunction
        enumStep.value = AutomationCreateSteps.FunctionParameters
      }

      if (props.preselectedProject) {
        selectedProject.value = props.preselectedProject
      }
    }
  },
  { flush: 'sync' }
)

watch(selectedFunction, (newVal, oldVal) => {
  if (newVal?.id !== oldVal?.id) {
    // Reset params
    functionParameters.value = undefined
  }
})
</script>
