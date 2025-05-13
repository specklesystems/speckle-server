<template>
  <div>
    <div class="text-foreground-2 text-body-2xs mb-1 pl-1">{{ control.label }}</div>
    <FormSwitch
      :name="fieldName"
      :disabled="!control.enabled"
      :model-value="modelValue"
      :rules="validator"
      :label="control.label"
      :value="true"
      :description="control.description"
      :show-label="false"
      size="xl"
      :validate-on-value-update="validateOnValueUpdate"
      @update:model-value="handleChange"
    />
  </div>
</template>
<script setup lang="ts">
import type { ControlElement } from '@jsonforms/core'
import { rendererProps, useJsonFormsControl } from '@jsonforms/vue'
import { useJsonRendererBaseSetup } from '~/lib/form/composables/jsonRenderers'

const props = defineProps({
  ...rendererProps<ControlElement>()
})

const { handleChange, control, validator, fieldName, validateOnValueUpdate } =
  useJsonRendererBaseSetup(useJsonFormsControl(props), {
    onChangeValueConverter: (val: true | undefined) => {
      return !!val
    }
  })

const modelValue = computed(() => {
  return control.value.data ? true : undefined
})
</script>
