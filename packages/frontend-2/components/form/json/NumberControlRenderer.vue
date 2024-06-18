<template>
  <FormTextInput
    :name="fieldName"
    :disabled="!control.enabled"
    :model-value="control.data + ''"
    :rules="validator"
    :label="control.label"
    color="foundation"
    type="number"
    step="any"
    size="lg"
    show-label
    :show-required="isRequired"
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

const props = defineProps({
  ...rendererProps<ControlElement>()
})

const {
  handleChange,
  control,
  validator,
  appliedOptions,
  fieldName,
  validateOnValueUpdate,
  isRequired
} = useJsonRendererBaseSetup(useJsonFormsControl(props), {
  onChangeValueConverter: (val: string) => {
    // Convert to number, if possible
    const num = parseFloat(val)
    return isNaN(num) ? undefined : num
  }
})
</script>
