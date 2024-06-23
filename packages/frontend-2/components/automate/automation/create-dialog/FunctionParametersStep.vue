<template>
  <div>
    <template v-if="finalParams">
      <FormJsonForm
        ref="jsonForm"
        v-model:data="parameters"
        :schema="finalParams"
        class="space-y-4"
        :validate-on-mount="false"
        @change="handler"
      />
    </template>
    <CommonAlert v-else color="info">
      <template #title>
        No parameters defined for the selected function release
      </template>
    </CommonAlert>
  </div>
</template>
<script setup lang="ts">
import type { JsonFormsChangeEvent } from '@jsonforms/vue'
import type { Optional } from '@speckle/shared'
import { useJsonFormsChangeHandler } from '~/lib/automate/composables/jsonSchema'
import { formatVersionParams } from '~/lib/automate/helpers/jsonSchema'
import { graphql } from '~/lib/common/generated/gql'
import type { AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunctionFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunction on AutomateFunction {
    id
    releases(limit: 1) {
      items {
        id
        inputSchema
      }
    }
  }
`)

const props = defineProps<{
  fn: AutomateAutomationCreateDialogFunctionParametersStep_AutomateFunctionFragment
}>()

const jsonForm = ref<{ triggerChange: () => Promise<Optional<JsonFormsChangeEvent>> }>()

const finalParams = computed(() => formatVersionParams(release.value?.inputSchema))
const { handler, hasErrors: hasJsonFormErrors } = useJsonFormsChangeHandler({
  schema: finalParams
})

const parameters = defineModel<Optional<Record<string, unknown>>>('parameters', {
  required: true
})
const hasErrors = defineModel<boolean>('hasErrors', { required: true })

const release = computed(() =>
  props.fn.releases.items.length ? props.fn.releases.items[0] : undefined
)

const submit = async () => {
  if (jsonForm.value && finalParams.value) {
    return await jsonForm.value?.triggerChange()
  }

  return { data: undefined, errors: undefined }
}

// watch(
//   release,
//   () => {
//     if (finalParams.value) {
//       parameters.value = {}
//     }
//   },
//   { immediate: true }
// )

watch(
  hasJsonFormErrors,
  (value) => {
    hasErrors.value = value
  },
  { immediate: true }
)

defineExpose({ submit })
</script>
