<template>
  <LayoutDialog
    v-model:open="open"
    :title="title"
    :buttons="buttons"
    max-width="md"
    :buttons-wrapper-classes="buttonsWrapperClasses"
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
      <AutomateFunctionCreateDialogAuthorizeStep
        v-if="enumStep === FunctionCreateSteps.Authorize"
      />
      <AutomateFunctionCreateDialogTemplateStep
        v-else-if="enumStep === FunctionCreateSteps.Template"
        v-model:selected-template="selectedTemplate"
        :templates="templates"
      />
      <AutomateFunctionCreateDialogDetailsStep
        v-else-if="enumStep === FunctionCreateSteps.Details"
        :github-orgs="githubOrgs"
      />
      <AutomateFunctionCreateDialogDoneStep
        v-else-if="enumStep === FunctionCreateSteps.Done && createdFunction"
        :created-function="createdFunction"
      />
    </div>
  </LayoutDialog>
</template>
<script setup lang="ts">
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/vue/24/outline'
import { CommonStepsNumber, type LayoutDialogButton } from '@speckle/ui-components'
import type { CreatableFunctionTemplate } from '~/lib/automate/helpers/functions'
import { automateGithubAppAuthorizationCallback } from '~/lib/common/helpers/route'
import { useEnumSteps, useEnumStepsWidgetSetup } from '~/lib/form/composables/steps'
import { useForm } from 'vee-validate'
import { type Nullable, type SourceAppDefinition } from '@speckle/shared'
import { useCreateAutomateFunction } from '~/lib/automate/composables/management'
import { useMutationLoading } from '@vue/apollo-composable'
import type { AutomateFunctionCreateDialogDoneStep_AutomateFunctionFragment } from '~~/lib/common/generated/gql/graphql'
import { automationFunctionRoute } from '~/lib/common/helpers/route'

enum FunctionCreateSteps {
  Authorize,
  Template,
  Details,
  Done
}

type DetailsFormValues = {
  image?: Nullable<string>
  name: string
  description: string
  allowedSourceApps?: SourceAppDefinition[]
  tags?: string[]
  org?: string
}

const props = defineProps<{
  isAuthorized: boolean
  templates: CreatableFunctionTemplate[]
  githubOrgs: string[]
}>()
const open = defineModel<boolean>('open', { required: true })

const logger = useLogger()
const mutationLoading = useMutationLoading()
const createFunction = useCreateAutomateFunction()
const { handleSubmit: handleDetailsSubmit } = useForm<DetailsFormValues>()
const onDetailsSubmit = handleDetailsSubmit(async (values) => {
  if (!selectedTemplate.value) {
    logger.warn('Unexpectedly missing selected template')
    return
  }

  const res = await createFunction({
    input: {
      supportedSourceApps: (values.allowedSourceApps || []).map((a) => a.name),
      tags: values.tags || [],
      template: selectedTemplate.value.id,
      logo: values.image,
      name: values.name,
      description: values.description
    }
  })

  if (res?.id) {
    createdFunction.value = res
    step.value++
  }
})

const onSubmit = computed(() => {
  switch (enumStep.value) {
    case FunctionCreateSteps.Details:
      return onDetailsSubmit
    default:
      return noop
  }
})
const stepsOrder = computed(() => [
  ...(props.isAuthorized ? [] : [FunctionCreateSteps.Authorize]),
  FunctionCreateSteps.Template,
  FunctionCreateSteps.Details,
  FunctionCreateSteps.Done
])

const stepsWidgetData = computed(() => [
  {
    step: FunctionCreateSteps.Template,
    title: 'Choose a template'
  },
  {
    step: FunctionCreateSteps.Details,
    title: 'Function details'
  }
])

const selectedTemplate = ref<CreatableFunctionTemplate>()
const githubScopes = ref(['read:org', 'read:user', 'repo'])
const createdFunction =
  ref<AutomateFunctionCreateDialogDoneStep_AutomateFunctionFragment>()

const {
  public: { automateGhClientId }
} = useRuntimeConfig()
const apiBaseUrl = useApiOrigin()
const { enumStep, step } = useEnumSteps({ order: stepsOrder })
const {
  items: stepsWidgetSteps,
  model: stepsWidgetModel,
  shouldShowWidget: shouldShowStepsWidget
} = useEnumStepsWidgetSetup({ enumStep, widgetStepsMap: stepsWidgetData })

const title = computed(() => {
  switch (enumStep.value) {
    case FunctionCreateSteps.Authorize:
      return 'Authorize GitHub'
    case FunctionCreateSteps.Template:
    case FunctionCreateSteps.Details:
    case FunctionCreateSteps.Done:
      return 'Create function'
    default:
      return 'TODO'
  }
})

const authorizeGithubUrl = computed(() => {
  const redirectUrl = new URL(automateGithubAppAuthorizationCallback, apiBaseUrl)
  const url = new URL(`/login/oauth/authorize`, 'https://github.com')

  url.searchParams.set('client_id', automateGhClientId)
  url.searchParams.set('scope', githubScopes.value.join(','))
  url.searchParams.set('redirect_uri', redirectUrl.toString())

  return url.toString()
})

const buttons = computed((): LayoutDialogButton[] => {
  switch (enumStep.value) {
    case FunctionCreateSteps.Authorize:
      return [
        {
          text: 'Close',
          props: {
            color: 'secondary',
            fullWidth: true
          },
          onClick: () => (open.value = false)
        },
        {
          text: 'Authorize',
          props: {
            fullWidth: true,
            disabled: !automateGhClientId.length,
            to: authorizeGithubUrl.value,
            external: true
          }
        }
      ]
    case FunctionCreateSteps.Template:
      return [
        {
          text: 'Next',
          props: {
            iconRight: ChevronRightIcon,
            disabled: !selectedTemplate.value
          },
          onClick: () => step.value++
        }
      ]
    case FunctionCreateSteps.Details:
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
          submit: true,
          disabled: mutationLoading.value
        }
      ]
    case FunctionCreateSteps.Done:
      return [
        {
          text: 'Close',
          props: {
            color: 'secondary',
            fullWidth: true
          },
          onClick: () => (open.value = false)
        },
        {
          text: 'Go to Function',
          props: {
            iconRight: ArrowRightIcon,
            fullWidth: true,
            to: createdFunction.value?.id
              ? automationFunctionRoute(createdFunction.value.id)
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
    case FunctionCreateSteps.Template:
      return 'justify-end'
    case FunctionCreateSteps.Details:
      return 'justify-between'
    default:
      return ''
  }
})

const reset = () => {
  step.value = 0
  selectedTemplate.value = undefined
}

const onDialogSubmit = (e: SubmitEvent) => onSubmit.value(e)

watch(
  () => props.isAuthorized,
  (newVal, oldVal) => {
    if (newVal === oldVal) return
    reset()
  }
)

watch(open, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    reset()
  }
})
</script>
