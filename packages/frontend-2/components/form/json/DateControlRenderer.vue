<template>
  <FormTextInput
    :name="fieldName"
    :disabled="!control.enabled"
    :model-value="control.data"
    :rules="validator"
    :label="control.label"
    show-label
    type="date"
    size="lg"
    max="9999-12-31"
    :placeholder="appliedOptions['placeholder']"
    :help="control.description"
    :validate-on-value-update="validateOnValueUpdate"
    :show-required="isRequired"
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
} = useJsonRendererBaseSetup(useJsonFormsControl(props))
</script>
