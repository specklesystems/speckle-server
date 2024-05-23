<template>
  <LayoutDialog
    v-model:open="open"
    max-width="lg"
    :title="title"
    :buttons-wrapper-classes="buttonsWrapperClasses"
    :buttons="buttons"
    :on-submit="onDialogSubmit"
    prevent-close-on-click-outside
  >
    <template v-if="isTestAutomation" #header>
      Create
      <span class="font-extrabold text-fancy-gradient">Test</span>
      Automation
    </template>
    <div class="flex flex-col gap-11">
      <CommonStepsNumber
        v-if="shouldShowStepsWidget"
        v-model="stepsWidgetModel"
        :steps="stepsWidgetSteps"
        :go-vertical-below="TailwindBreakpoints.sm"
        non-interactive
      />
      <AutomateAutomationCreateDialogSelectFunctionStep
        v-if="enumStep === AutomationCreateSteps.SelectFunction"
        v-model:selected-function="selectedFunction"
        :preselected-function="validatedPreselectedFunction"
      />
      <AutomateAutomationCreateDialogFunctionParametersStep
        v-else-if="
          enumStep === AutomationCreateSteps.FunctionParameters && selectedFunction
        "
        ref="parametersStep"
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
      <AutomateAutomationCreateDialogDoneStep
        v-else-if="
          enumStep === AutomationCreateSteps.Done && automationId && selectedFunction
        "
        :automation-id="automationId"
        :function-name="selectedFunction.name"
      />
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import { useEnumSteps, useEnumStepsWidgetSetup } from '~/lib/form/composables/steps'
import {
  CommonStepsNumber,
  TailwindBreakpoints,
  type LayoutDialogButton
} from '@speckle/ui-components'
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CodeBracketIcon
} from '@heroicons/vue/24/outline'
import { graphql } from '~/lib/common/generated/gql'
import { Automate, type Optional } from '@speckle/shared'
import type { CreateAutomationSelectableFunction } from '~/lib/automate/helpers/automations'
import {
  AutomateRunTriggerType,
  type FormSelectModels_ModelFragment,
  type FormSelectProjects_ProjectFragment
} from '~/lib/common/generated/gql/graphql'
import { useForm } from 'vee-validate'
import {
  useCreateAutomation,
  useCreateAutomationRevision,
  useUpdateAutomation
} from '~/lib/projects/composables/automationManagement'
import { formatJsonFormSchemaInputs } from '~/lib/automate/helpers/jsonSchema'
import { projectAutomationRoute } from '~/lib/common/helpers/route'
import {
  useAutomationInputEncryptor,
  type AutomationInputEncryptor
} from '~/lib/automate/composables/automations'

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

const config = useRuntimeConfig()
const enableCreateTestAutomation = computed(() => {
  return config.public.FF_TEST_AUTOMATIONS_ENABLED
})

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

const inputEncryption = useAutomationInputEncryptor({ ensureWhen: open })
const logger = useLogger()
const updateAutomation = useUpdateAutomation()
const createAutomation = useCreateAutomation()
const createRevision = useCreateAutomationRevision()
const { enumStep, step } = useEnumSteps({ order: stepsOrder })
const {
  items: stepsWidgetSteps,
  model: stepsWidgetModel,
  shouldShowWidget
} = useEnumStepsWidgetSetup({ enumStep, widgetStepsMap: stepsWidgetData })

const parametersStep = ref<{ submit: () => Promise<void> }>()

const creationLoading = ref(false)
const automationId = ref<string>()
const automationName = ref<string>()
const selectedProject = ref<FormSelectProjects_ProjectFragment>()
const selectedModel = ref<FormSelectModels_ModelFragment>()
const selectedFunction = ref<Optional<CreateAutomationSelectableFunction>>()
const functionParameters = ref<Record<string, unknown>>()
const hasParameterErrors = ref(false)
const isTestAutomation = ref(false)

const shouldShowStepsWidget = computed(() => {
  return !!shouldShowWidget.value && !isTestAutomation.value
})

const title = computed(() => {
  return isTestAutomation.value ? null : 'Create Automation'
})

const buttons = computed((): LayoutDialogButton[] => {
  switch (enumStep.value) {
    case AutomationCreateSteps.SelectFunction: {
      const selectFnNextButton: LayoutDialongButton = {
        id: 'selectFnNext',
        text: 'Next',
        props: {
          iconRight: ChevronRightIcon,
          disabled: !selectedFunction.value
        },
        onClick: () => {
          step.value++
        }
      }

      const createTestAutomationButton: LayoutDialogButton = {
        id: 'createTestAutomation',
        text: 'Create test automation',
        props: {
          iconLeft: CodeBracketIcon,
          outlined: true
        },
        onClick: () => {
          isTestAutomation.value = true
          step.value = 2
        }
      }

      const stepButtons = enableCreateTestAutomation.value
        ? [createTestAutomationButton, selectFnNextButton]
        : [selectFnNextButton]

      return stepButtons as LayoutDialogButton[]
    }
    case AutomationCreateSteps.FunctionParameters:
      return [
        {
          id: 'fnParamsPrev',
          text: 'Previous',
          props: {
            color: 'secondary',
            iconLeft: ChevronLeftIcon,
            textColor: 'primary'
          },
          onClick: () => step.value--
        },
        {
          id: 'fnParamsNext',
          text: 'Next',
          props: {
            iconRight: ChevronRightIcon,
            disabled: hasParameterErrors.value
          },
          submit: true
        }
      ]
    case AutomationCreateSteps.AutomationDetails:
      return [
        {
          id: 'detailsPrev',
          text: 'Previous',
          props: {
            color: 'secondary',
            iconLeft: ChevronLeftIcon,
            textColor: 'primary'
          },
          onClick: () => step.value--
        },
        {
          id: 'detailsCreate',
          text: 'Create',
          submit: true,
          disabled: creationLoading.value
        }
      ]
    case AutomationCreateSteps.Done:
      return [
        {
          id: 'doneClose',
          text: 'Close',
          props: {
            color: 'secondary',
            fullWidth: true
          },
          onClick: () => (open.value = false)
        },
        {
          id: 'doneGoToAutomation',
          text: 'Go to Automation',
          props: {
            iconRight: ArrowRightIcon,
            fullWidth: true,
            to:
              selectedProject.value && automationId.value
                ? projectAutomationRoute(selectedProject.value.id, automationId.value)
                : undefined
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
      return enableCreateTestAutomation.value ? 'justify-between' : 'justify-end'
    case AutomationCreateSteps.Done:
      return 'flex-col sm:flex-row sm:justify-between'
    default:
      return 'justify-between'
  }
})

const validatedPreselectedFunction = computed(() => {
  if (!(props.preselectedFunction?.releases.items || []).length) {
    return undefined
  }

  return props.preselectedFunction
})

const reset = () => {
  step.value = 0
  selectedFunction.value = undefined
  functionParameters.value = undefined
  hasParameterErrors.value = false
  selectedProject.value = undefined
  selectedModel.value = undefined
  automationName.value = undefined
  automationId.value = undefined
  isTestAutomation.value = false
}

const onDetailsSubmit = handleDetailsSubmit(async () => {
  const fn = selectedFunction.value
  const fnRelease = selectedFunction.value?.releases.items[0]
  const project = selectedProject.value
  const model = selectedModel.value
  const parameters = functionParameters.value
  const name = automationName.value

  if (!fn || !project || !model || !name?.length || !fnRelease) {
    logger.error('Missing required data', {
      fn,
      project,
      model,
      parameters,
      name,
      fnRelease
    })
    return
  }

  creationLoading.value = true
  let aId: Optional<string> = undefined
  let automationEncrypt: Optional<AutomationInputEncryptor> = undefined
  try {
    const createRes = await createAutomation({
      projectId: project.id,
      input: {
        name,
        enabled: false
      }
    })
    aId = automationId.value = createRes?.id
    if (!aId) {
      logger.error('Failed to create automation', { createRes })
      return
    }

    automationEncrypt = await inputEncryption.forAutomation({
      automationId: aId,
      projectId: project.id
    })

    const cleanParams =
      formatJsonFormSchemaInputs(parameters, fnRelease.inputSchema) || null
    const encryptedParams = automationEncrypt.encryptInputs({
      inputs: cleanParams
    })

    const revisionRes = await createRevision(
      {
        projectId: project.id,
        input: {
          automationId: aId,
          functions: [
            {
              functionReleaseId: fnRelease.id,
              functionId: fn.id,
              parameters: encryptedParams
            }
          ],
          triggerDefinitions: <Automate.AutomateTypes.TriggerDefinitionsSchema>{
            version: Automate.AutomateTypes.TRIGGER_DEFINITIONS_SCHEMA_VERSION,
            definitions: [
              {
                type: AutomateRunTriggerType.VersionCreated,
                modelId: model.id
              }
            ]
          }
        }
      },
      { hideSuccessToast: true }
    )

    if (!revisionRes?.id) {
      logger.error('Failed to create revision', { revisionRes })
      return
    }

    // Enable
    await updateAutomation({
      projectId: project.id,
      input: {
        id: aId,
        enabled: true
      }
    })

    step.value++
  } finally {
    creationLoading.value = false
    automationEncrypt?.dispose()
  }
})

const onDialogSubmit = async (e: SubmitEvent) => {
  if (enumStep.value === AutomationCreateSteps.AutomationDetails) {
    await onDetailsSubmit(e)
  } else if (enumStep.value === AutomationCreateSteps.FunctionParameters) {
    await parametersStep.value?.submit()
    if (!hasParameterErrors.value) {
      step.value++
    }
  }
}

watch(
  open,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      reset()

      if (validatedPreselectedFunction.value) {
        selectedFunction.value = validatedPreselectedFunction.value
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
