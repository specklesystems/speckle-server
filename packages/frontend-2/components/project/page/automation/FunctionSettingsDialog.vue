<template>
  <LayoutDialog
    v-model:open="open"
    max-width="md"
    :title="`Function settings`"
    @fully-closed="$emit('fully-closed')"
  >
    <div v-if="false" class="flex flex-col space-y-4">
      <CommonLoadingIcon class="mx-auto" />
    </div>
    <div v-else-if="hasRequiredData && functionId" class="flex flex-col space-y-4">
      <FormSelectAutomateFunctionReleases
        v-model="selectedRelease"
        show-label
        :function-id="functionId"
        :resolve-first-model-value="resolveFirstModelValue"
        name="version"
        label="Function release"
        button-style="tinted"
        :class="{ hidden: !selectedRelease }"
      />
      <template v-if="!selectedRelease">
        <CommonLoadingBar loading class="w-full" />
      </template>
      <template v-else>
        <CommonAlert v-if="!inputSchema" color="info">
          <template #title>
            No parameters defined for the selected function release
          </template>
        </CommonAlert>
        <FormJsonForm
          v-else
          ref="jsonForm"
          v-model:data="selectedVersionInputs"
          :validate-on-mount="false"
          :schema="inputSchema"
          class="space-y-4"
          @change="handler"
        />
        <CommonModelSelect
          v-model="selectedModel"
          class="!mt-8"
          :project-id="projectId"
          name="model"
          label="Target model"
          show-label
          help="Select model that the function will run on when new versions are created"
        />
        <div class="h-32">
          <!-- To ensure the dropdown doesn't cause a vertical scrollbar -->
        </div>
      </template>
    </div>
    <template #buttons>
      <div class="flex w-full space-x-2">
        <FormButton
          v-if="revisionFn"
          text
          target="_blank"
          :to="automationFunctionRoute(revisionFn.release.function.id)"
        >
          View function
        </FormButton>
        <div class="grow" />
        <FormButton color="outline" @click="open = false">Close</FormButton>
        <FormButton
          :disabled="hasErrors || loading || !hasRequiredData || !selectedModel"
          @click="onSave"
        >
          Save
        </FormButton>
      </div>
    </template>
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import { automationFunctionRoute } from '~/lib/common/helpers/route'
import {
  useJsonFormsChangeHandler,
  hasJsonFormErrors as hasFormErrors
} from '~/lib/automate/composables/jsonSchema'
import {
  formatJsonFormSchemaInputs,
  formattedJsonFormSchema
} from '~/lib/automate/helpers/jsonSchema'
import { graphql } from '~/lib/common/generated/gql'
import {
  AutomateRunTriggerType,
  type CommonModelSelectorModelFragment,
  type ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFragment,
  type ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunctionFragment,
  type SearchAutomateFunctionReleaseItemFragment
} from '~/lib/common/generated/gql/graphql'
import { Automate } from '@speckle/shared'
import { useCreateAutomationRevision } from '~/lib/projects/composables/automationManagement'
import {
  useAutomationInputEncryptor,
  type AutomationInputEncryptor
} from '~/lib/automate/composables/automations'
import { useMixpanel } from '~/lib/core/composables/mp'
import type { JsonFormsChangeEvent } from '@jsonforms/vue'

type AutomationRevisionFunction =
  ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunctionFragment

type AutomationRevision =
  ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFragment

graphql(`
  fragment ProjectPageAutomationFunctionSettingsDialog_AutomationRevisionFunction on AutomationRevisionFunction {
    parameters
    release {
      id
      inputSchema
      function {
        id
      }
    }
  }
`)

graphql(`
  fragment ProjectPageAutomationFunctionSettingsDialog_AutomationRevision on AutomationRevision {
    id
    triggerDefinitions {
      ... on VersionCreatedTriggerDefinition {
        type
        model {
          id
          ...CommonModelSelectorModel
        }
      }
    }
  }
`)

const emit = defineEmits<{
  (e: 'fully-closed'): void
  (e: 'save'): void
}>()

const props = defineProps<{
  projectId: string
  automationId: string
  revisionFn: MaybeNullOrUndefined<AutomationRevisionFunction>
  revision: MaybeNullOrUndefined<AutomationRevision>
}>()

const open = defineModel<boolean>('open', { required: true })
const createNewAutomationRevision = useCreateAutomationRevision()
const inputEncryption = useAutomationInputEncryptor({ ensureWhen: open })
const { triggerNotification } = useGlobalToast()
const logger = useLogger()
const mixpanel = useMixpanel()

const jsonForm = ref<{ triggerChange: () => Promise<Optional<JsonFormsChangeEvent>> }>()
const selectedModel = ref<CommonModelSelectorModelFragment>()
const selectedRelease = ref<SearchAutomateFunctionReleaseItemFragment>()
const inputSchema = computed(() =>
  formattedJsonFormSchema(selectedRelease.value?.inputSchema)
)
const {
  handler,
  hasErrors: hasJsonFormErrors,
  reset: resetJsonFormsState
} = useJsonFormsChangeHandler({ schema: inputSchema })

const selectedVersionInputs = ref<Record<string, unknown>>()
const loading = ref(false)

const parentSelectedModel = computed(() => props.revision?.triggerDefinitions[0]?.model)
const hasRequiredData = computed(() => !!props.revisionFn && !!props.revision)
const functionId = computed(() => props.revisionFn?.release.function.id)
const currentReleaseId = computed(() => props.revisionFn?.release.id)
const selectedReleaseId = computed(() => selectedRelease.value?.id)

const hasErrors = computed(() => {
  if (hasJsonFormErrors.value) return true
  if (!selectedRelease.value) return true
  return false
})

const resolveFirstModelValue = (items: SearchAutomateFunctionReleaseItemFragment[]) => {
  const modelValue = currentReleaseId.value
    ? items.find((i) => i.id === currentReleaseId.value)
    : undefined

  if (!modelValue) {
    // This def shouldn't happen, something's wrong
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Could not find the selected function version',
      description: 'Please try again or contact support'
    })
    logger.error('Could not find the selected function version', {
      functionId: functionId.value,
      functionVersionId: currentReleaseId.value
    })
  }

  return modelValue
}

const onSave = async () => {
  const fId = functionId.value
  const rId = selectedReleaseId.value
  const model = selectedModel.value

  // Validate
  const validationResult = await jsonForm.value?.triggerChange()
  if (!validationResult || hasFormErrors(validationResult)) {
    return
  }

  if (hasErrors.value || !fId || !rId || !hasRequiredData.value || !model) return

  loading.value = true
  let automationEncrypt: Optional<AutomationInputEncryptor> = undefined
  try {
    automationEncrypt = await inputEncryption.forAutomation({
      automationId: props.automationId,
      projectId: props.projectId
    })

    const cleanParameters =
      formatJsonFormSchemaInputs(selectedVersionInputs.value, inputSchema.value) || null
    const parameters = automationEncrypt.encryptInputs({
      inputs: cleanParameters
    })

    // TODO: Apollo cache mutation afterwards
    const res = await createNewAutomationRevision({
      projectId: props.projectId,
      input: {
        automationId: props.automationId,
        functions: [
          {
            functionReleaseId: rId,
            functionId: fId,
            parameters
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
    })
    if (res?.id) {
      mixpanel.track('Automation Revision Created', {
        automationId: props.automationId,
        projectId: props.projectId,
        functionId: fId,
        functionReleaseId: rId,
        modelId: model.id
      })
    }
  } finally {
    automationEncrypt?.dispose()
    loading.value = false
  }

  open.value = false
  emit('save')
}

// Reset everything if props change
watch(
  () => <const>[props.revisionFn?.release.function.id, props.revisionFn?.release.id],
  ([newFunctionId, newFunctionRevisionId], [oldFunctionId, oldFunctionRevisionId]) => {
    if (
      newFunctionId === oldFunctionId &&
      newFunctionRevisionId === oldFunctionRevisionId
    )
      return

    selectedRelease.value = undefined
  }
)

// Update inputs when selected version changes
watch(selectedRelease, (newSelectedVersion, oldSelectedVersion) => {
  const id = newSelectedVersion?.id
  const oldId = oldSelectedVersion?.id
  if (id === oldId) return

  if (!id || id !== props.revisionFn?.release.id) {
    selectedVersionInputs.value = undefined
    resetJsonFormsState()
    return
  }

  const existingValues = formatJsonFormSchemaInputs(
    props.revisionFn.parameters,
    inputSchema.value,
    { cleanRedacted: true }
  )
  selectedVersionInputs.value = existingValues
  resetJsonFormsState()
})

// Update model when props change
watch(
  parentSelectedModel,
  (newVal, oldVal) => {
    if (newVal?.id === oldVal?.id) return

    selectedModel.value = newVal || undefined
  },
  { immediate: true }
)
</script>
