<template>
  <FormTextInput
    :name="fieldName"
    :disabled="!control.enabled"
    :model-value="modelValue"
    :rules="validator"
    :label="control.label"
    :show-clear="isRequired"
    show-label
    type="datetime-local"
    size="lg"
    max="9999-12-31T23:59"
    :placeholder="appliedOptions['placeholder']"
    :help="control.description"
    :validate-on-value-update="validateOnValueUpdate"
    @update:model-value="handleChange"
  />
</template>
<script setup lang="ts">
import { type ControlElement } from '@jsonforms/core'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { useJsonRendererBaseSetup } from '~/lib/form/composables/jsonRenderers'

const zuluTimeSuffix = ':00.000Z'

const props = defineProps({
  ...rendererProps<ControlElement>()
})

const toISOString = (inputDateTime: string) => {
  return inputDateTime ? inputDateTime + zuluTimeSuffix : undefined
}

const {
  handleChange,
  control,
  validator,
  appliedOptions,
  fieldName,
  validateOnValueUpdate,
  isRequired
} = useJsonRendererBaseSetup(useJsonFormsControl(props), {
  onChangeValueConverter: (val) => toISOString(val as string)
})

const modelValue = computed(() =>
  control.value.data
    ? (control.value.data as string).replace(zuluTimeSuffix, '')
    : undefined
)
</script>
