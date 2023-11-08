<template>
  <FormJsonEnumControlRenderer
    v-bind="$props"
    :multiple="false"
    :control-overrides="controlOverrides"
  />
</template>
<script setup lang="ts">
import { ControlElement } from '@jsonforms/core'
import { rendererProps, useJsonFormsOneOfEnumControl } from '@jsonforms/vue'

const props = defineProps({
  ...rendererProps<ControlElement>()
})

// eslint-disable-next-line @typescript-eslint/unbound-method
const controlOverrides = useJsonFormsOneOfEnumControl(props)
</script>
