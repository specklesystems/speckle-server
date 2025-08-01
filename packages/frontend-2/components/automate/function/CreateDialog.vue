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
    <div class="flex flex-col gap-6">
      <CommonStepsNumber
        v-if="shouldShowStepsWidget"
        v-model="stepsWidgetModel"
        :steps="stepsWidgetSteps"
        :go-vertical-below="TailwindBreakpoints.sm"
        non-interactive
        class="pt-1"
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
  CommonStepsNumber,
  type LayoutDialogButton,
  TailwindBreakpoints
} from '@speckle/ui-components'
import type {
  CreatableFunctionTemplate,
  FunctionDetailsFormValues
} from '~/lib/automate/helpers/functions'
import {
  automateGithubAppAuthorizationRoute,
  automateFunctionRoute
} from '~/lib/common/helpers/route'
import { useEnumSteps, useEnumStepsWidgetSetup } from '~/lib/form/composables/steps'
import { useForm } from 'vee-validate'
import {
  useCreateAutomateFunction,
  useUpdateAutomateFunction
} from '~/lib/automate/composables/management'
import { useMutationLoading } from '@vue/apollo-composable'
import type {
  AutomateFunctionCreateDialogDoneStep_AutomateFunctionFragment,
  AutomateFunctionCreateDialog_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'
import { graphql } from '~/lib/common/generated/gql'

enum FunctionCreateSteps {
  Authorize,
  Template,
  Details,
  Done
}

type DetailsFormValues = FunctionDetailsFormValues

graphql(`
  fragment AutomateFunctionCreateDialog_Workspace on Workspace {
    id
    name
    slug
  }
`)

const props = defineProps<{
  isAuthorized: boolean
  templates: CreatableFunctionTemplate[]
  githubOrgs: string[]
  workspace?: AutomateFunctionCreateDialog_WorkspaceFragment
}>()
const open = defineModel<boolean>('open', { required: true })

const mixpanel = useMixpanel()
const logger = useLogger()
const mutationLoading = useMutationLoading()
const createFunction = useCreateAutomateFunction()
const updateFunction = useUpdateAutomateFunction()
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
      description: values.description,
      org: values.org
    }
  })

  if (!res?.id) {
    // TODO: Error toast with butter
    return
  }

  mixpanel.track('Automate Function Created', {
    functionId: res.id,
    templateId: selectedTemplate.value.id,
    name: values.name,
    /* eslint-disable-next-line camelcase */
    workspace_id: props.workspace?.id
  })
  createdFunction.value = res
  step.value++

  if (!props.workspace?.id) {
    return
  }

  await updateFunction({
    input: {
      id: res.id,
      workspaceIds: [props.workspace.id]
    }
  })
})

const onSubmit = computed(() => {
  switch (enumStep.value) {
    case FunctionCreateSteps.Details:
      mixpanel.track('Automate Configure Function Details')
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
const createdFunction =
  ref<AutomateFunctionCreateDialogDoneStep_AutomateFunctionFragment>()

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
      return ''
  }
})

const authorizeGithubUrl = computed(() => {
  const redirectUrl = new URL(
    automateGithubAppAuthorizationRoute(props.workspace?.slug),
    apiBaseUrl
  )
  return redirectUrl.toString()
})

const buttons = computed((): LayoutDialogButton[] => {
  switch (enumStep.value) {
    case FunctionCreateSteps.Authorize:
      return [
        {
          id: 'authorizeClose',
          text: 'Close',
          props: {
            color: 'outline',
            fullWidth: true
          },
          onClick: () => (open.value = false)
        },
        {
          id: 'authorizeAuthorize',
          text: 'Authorize',
          onClick: () => {
            mixpanel.track('Automate Start Authorize GitHub App')
          },
          props: {
            fullWidth: true,
            to: authorizeGithubUrl.value,
            external: true
          }
        }
      ]
    case FunctionCreateSteps.Template:
      return [
        {
          id: 'templateNext',
          text: 'Next',
          props: {
            disabled: !selectedTemplate.value
          },
          onClick: () => {
            mixpanel.track('Automate Select Function Template')
            step.value++
          }
        }
      ]
    case FunctionCreateSteps.Details:
      return [
        {
          id: 'detailsPrevious',
          text: 'Back',
          props: {
            color: 'outline'
          },
          onClick: () => step.value--
        },
        {
          id: 'detailsCreate',
          text: 'Create',
          submit: true,
          disabled: mutationLoading.value
        }
      ]
    case FunctionCreateSteps.Done:
      return [
        {
          id: 'doneClose',
          text: 'Close',
          props: {
            color: 'outline',
            fullWidth: true
          },
          onClick: () => (open.value = false)
        },
        {
          id: 'doneGoToFunction',
          text: 'Go to Function',
          props: {
            fullWidth: true,
            to: createdFunction.value?.id
              ? automateFunctionRoute(createdFunction.value.id)
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
    case FunctionCreateSteps.Authorize:
    case FunctionCreateSteps.Done:
      return 'flex-col sm:flex-row'
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
