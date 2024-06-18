<template>
  <FormTextArea
    :name="fieldName"
    :disabled="!control.enabled"
    :model-value="control.data"
    :rules="validator"
    :placeholder="appliedOptions['placeholder']"
    :help="control.description"
    :label="control.label"
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
} = useJsonRendererBaseSetup(useJsonFormsControl(props))
</script>
