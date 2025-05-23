<template>
  <form class="flex flex-col space-y-4 form-json-form">
    <JsonForms
      ref="internalRef"
      :renderers="renderers"
      :schema="finalSchema"
      :uischema="finalUiSchema"
      :data="data || {}"
      :readonly="readonly"
      :ajv="ajv"
      @change="onChange"
    />
  </form>
</template>
<script setup lang="ts">
import { createAjv } from '@jsonforms/core'
import type { JsonSchema, UISchemaElement } from '@jsonforms/core'
import { JsonForms, type JsonFormsChangeEvent } from '@jsonforms/vue'
import type { Nullable, Optional } from '@speckle/shared'
import { useMounted } from '@vueuse/core'
import { omit } from 'lodash-es'
import { useForm } from 'vee-validate'
import { renderers } from '~/lib/form/jsonRenderers'

type DataType = Record<string, unknown>

const emit = defineEmits<(e: 'change', val: JsonFormsChangeEvent) => void>()

const props = withDefaults(
  defineProps<{
    schema: JsonSchema
    uiSchema?: UISchemaElement
    readonly?: boolean
    validateOnMount?: boolean
  }>(),
  { validateOnMount: true }
)

const { validate } = useForm()

const isMounted = useMounted()
const internalRef = ref<Nullable<{ jsonforms: { core: JsonFormsChangeEvent } }>>(null)
const data = defineModel<Record<string, unknown>>('data')
const ajv = createAjv({ useDefaults: true })

const finalSchema = computed(() => {
  const base = props.schema
  return omit(base, ['$schema', '$id'])
})

const autoGeneratedUiSchema = computed(() => {
  const properties = Object.keys(props.schema.properties || {})
  return {
    type: 'VerticalLayout',
    elements: properties.map((p) => ({
      type: 'Control',
      scope: `#/properties/${p}`
    }))
  }
})
const finalUiSchema = computed(() => props.uiSchema || autoGeneratedUiSchema.value)

const onChange = async (e: JsonFormsChangeEvent) => {
  if (!isMounted.value && !props.validateOnMount) {
    return
  }

  data.value = e.data as DataType
  await validate({ mode: 'force' })
  emit('change', e)
}

const getFormState = (): Optional<JsonFormsChangeEvent> =>
  internalRef.value?.jsonforms.core
    ? ({
        data: internalRef.value.jsonforms.core.data,
        errors: internalRef.value.jsonforms.core.errors
      } as JsonFormsChangeEvent)
    : undefined

const triggerChange = async () => {
  const state = getFormState()
  if (state) {
    await onChange(state)
  }
  return state
}

defineExpose({ getFormState, triggerChange })
</script>
<style lang="postcss">
.form-json-form {
  .vertical-layout {
    @apply space-y-4;
  }
}
</style>
