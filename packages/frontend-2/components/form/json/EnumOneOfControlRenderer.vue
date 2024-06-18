<template>
  <FormJsonEnumControlRenderer
    v-bind="$props"
    :multiple="false"
    :control-overrides="controlOverrides"
  />
</template>
<script setup lang="ts">
import { type ControlElement } from '@jsonforms/core'
import { rendererProps, useJsonFormsOneOfEnumControl } from '@jsonforms/vue'

const props = defineProps({
  ...rendererProps<ControlElement>()
})

const controlOverrides = useJsonFormsOneOfEnumControl(props)
</script>
