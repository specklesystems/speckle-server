<template>
  <LayoutDialog
    v-model:open="open"
    max-width="lg"
    :title="title"
    :buttons-wrapper-classes="buttonsWrapperClasses"
    :buttons="buttons"
    :on-submit="onDialogSubmit"
    prevent-close-on-click-outside
    @fully-closed="reset"
  >
    <template v-if="isTestAutomation" #header>Create test automation</template>
    <div class="flex flex-col gap-4">
      <CommonStepsNumber
        v-if="shouldShowStepsWidget"
        v-model="stepsWidgetModel"
        class="my-2"
        :steps="stepsWidgetSteps"
        :go-vertical-below="TailwindBreakpoints.sm"
        non-interactive
      />
      <CommonCard v-if="isTestAutomation" class="bg-foundation py-3 px-4">
        <p class="text-body-xs font-medium text-foreground">
          What is a "test automation"?
        </p>
        <ul class="list-disc ml-4 text-body-xs text-foreground-2 mt-2">
          <li>
            A test automation is a sandbox environment that allows you to connect your
            local development environment for testing purposes. It enables you to run
            your code against project data and submit results directly to the connected
            test automation.
          </li>
          <li>
            Unlike regular automations, test automations are not triggered by changes to
            project data. They cannot be started by pushing a new version to a model.
          </li>
          <li>Consequently, test automations do not execute published functions.</li>
        </ul>
      </CommonCard>
      <AutomateAutomationCreateDialogSelectFunctionStep
        v-if="enumStep === AutomationCreateSteps.SelectFunction"
        v-model:selected-function="selectedFunction"
        :show-label="false"
        :show-required="false"
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
      <template v-else-if="enumStep === AutomationCreateSteps.AutomationDetails">
        <AutomateAutomationCreateDialogAutomationDetailsStep
          v-model:project="selectedProject"
          v-model:model="selectedModel"
          v-model:automation-name="automationName"
          :preselected-project="preselectedProject"
          :is-test-automation="isTestAutomation"
        />
        <AutomateAutomationCreateDialogSelectFunctionStep
          v-if="isTestAutomation"
          v-model:selected-function="selectedFunction"
          :preselected-function="validatedPreselectedFunction"
          :page-size="2"
        />
      </template>
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
  useCreateTestAutomation,
  useUpdateAutomation
} from '~/lib/projects/composables/automationManagement'
import { formatJsonFormSchemaInputs } from '~/lib/automate/helpers/jsonSchema'
import { projectAutomationRoute } from '~/lib/common/helpers/route'
import {
  useAutomationInputEncryptor,
  type AutomationInputEncryptor
} from '~/lib/automate/composables/automations'
import { useMixpanel } from '~/lib/core/composables/mp'
import { hasJsonFormErrors } from '~/lib/automate/composables/jsonSchema'
import type { JsonFormsChangeEvent } from '@jsonforms/vue'

enum AutomationCreateSteps {
  SelectFunction,
  FunctionParameters,
  AutomationDetails
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

const mixpanel = useMixpanel()

const { handleSubmit: handleDetailsSubmit } = useForm<DetailsFormValues>()

const stepsOrder = computed(() => [
  AutomationCreateSteps.SelectFunction,
  AutomationCreateSteps.FunctionParameters,
  AutomationCreateSteps.AutomationDetails
])

const stepsWidgetData = computed(() => [
  {
    step: AutomationCreateSteps.SelectFunction,
    title: 'Select function'
  },
  {
    step: AutomationCreateSteps.FunctionParameters,
    title: 'Set parameters'
  },
  {
    step: AutomationCreateSteps.AutomationDetails,
    title: 'Add details'
  }
])

const router = useRouter()
const inputEncryption = useAutomationInputEncryptor({ ensureWhen: open })
const logger = useLogger()
const updateAutomation = useUpdateAutomation()
const createAutomation = useCreateAutomation()
const createRevision = useCreateAutomationRevision()
const createTestAutomation = useCreateTestAutomation()

const { enumStep, step } = useEnumSteps({ order: stepsOrder })
const {
  items: stepsWidgetSteps,
  model: stepsWidgetModel,
  shouldShowWidget
} = useEnumStepsWidgetSetup({ enumStep, widgetStepsMap: stepsWidgetData })

const parametersStep = ref<{ submit: () => Promise<Optional<JsonFormsChangeEvent>> }>()

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

const enableSubmitTestAutomation = computed(() => {
  const isValidInput =
    !!automationName.value && !!selectedModel.value && !!selectedFunction.value
  const isLoading = creationLoading.value

  return isValidInput && !isLoading
})

const title = computed(() => {
  return isTestAutomation.value ? undefined : 'Create automation'
})

const buttons = computed((): LayoutDialogButton[] => {
  switch (enumStep.value) {
    case AutomationCreateSteps.SelectFunction:
      return [
        {
          id: 'createTestAutomation',
          text: 'Create test automation',
          props: {
            color: 'outline'
          },
          onClick: () => {
            isTestAutomation.value = true
            enumStep.value = AutomationCreateSteps.AutomationDetails
          }
        },
        {
          id: 'selectFnNext',
          text: 'Next',
          props: {
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
          id: 'fnParamsPrev',
          text: 'Previous',
          props: {
            color: 'outline'
          },
          onClick: () => step.value--
        },
        {
          id: 'fnParamsNext',
          text: 'Next',
          props: {
            disabled: hasParameterErrors.value
          },
          submit: true
        }
      ]
    case AutomationCreateSteps.AutomationDetails: {
      const automationButtons: LayoutDialogButton[] = [
        {
          id: 'detailsPrev',
          text: 'Previous',
          props: {
            color: 'outline'
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

      const testAutomationButtons: LayoutDialogButton[] = [
        {
          id: 'detailsPrev',
          text: 'Back',
          props: {
            color: 'outline'
          },
          onClick: reset
        },
        {
          id: 'submitTestAutomation',
          text: 'Create',
          disabled: !enableSubmitTestAutomation.value,
          submit: true
        }
      ]

      return isTestAutomation.value ? testAutomationButtons : automationButtons
    }
    default:
      return []
  }
})

const buttonsWrapperClasses = computed(() => {
  switch (enumStep.value) {
    case AutomationCreateSteps.SelectFunction:
      return 'justify-between'
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

const goToNewAutomation = async () => {
  if (!selectedProject.value || !automationId.value) {
    logger.error('Missing required data for redirect', {
      project: selectedProject.value,
      automationId: automationId.value
    })
    return
  }

  await router.push(
    projectAutomationRoute(selectedProject.value.id, automationId.value)
  )
}

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
    if (isTestAutomation.value) {
      // Use simplified pathway
      const testAutomationId = await createTestAutomation({
        projectId: project.id,
        input: {
          name,
          functionId: fn.id,
          modelId: model.id
        }
      })

      if (!testAutomationId) {
        logger.error('Failed to create test automation')
        return
      }

      automationId.value = testAutomationId
      await goToNewAutomation()
      return
    }

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

    mixpanel.track('Automation created', {
      automationId: aId,
      name,
      projectId: project.id,
      functionName: fn.name,
      functionId: fn.id,
      functionReleaseId: fnRelease.id,
      modelId: model.id
    })

    // Enable
    await updateAutomation(
      {
        projectId: project.id,
        input: {
          id: aId,
          enabled: true
        }
      },
      { hideSuccessToast: true }
    )

    await goToNewAutomation()
  } finally {
    creationLoading.value = false
    automationEncrypt?.dispose()
  }
})

const onDialogSubmit = async (e: SubmitEvent) => {
  if (enumStep.value === AutomationCreateSteps.AutomationDetails) {
    await onDetailsSubmit(e)
  } else if (enumStep.value === AutomationCreateSteps.FunctionParameters) {
    const validationResult = await parametersStep.value?.submit()
    if (validationResult && !hasJsonFormErrors(validationResult)) {
      step.value++
    }
  }
}

watch(open, (newVal, oldVal) => {
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
})

watch(selectedFunction, (newVal, oldVal) => {
  if (newVal?.id !== oldVal?.id) {
    // Reset params
    functionParameters.value = undefined
  }
})
</script>
