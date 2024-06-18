<template>
  <FormTextInput
    :name="fieldName"
    :disabled="!control.enabled"
    :model-value="control.data + ''"
    :rules="validator"
    :label="control.label"
    :placeholder="appliedOptions['placeholder']"
    :help="control.description"
    color="foundation"
    type="number"
    step="1"
    size="lg"
    show-label
    :show-required="isRequired"
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
    // Convert to int if possible
    const num = parseInt(val)
    return isNaN(num) ? undefined : num
  }
})
</script>
