<template>
  <!-- ONLY FOR TEST FOR NOW-->
  <form class="flex flex-col space-y-4 form-json-form">
    <span>Settings</span>
    <FormJsonForm :schema="jsonSchema" @change="onParamsFormChange"></FormJsonForm>
  </form>
</template>

<script setup lang="ts">
import type { JsonFormsChangeEvent } from '@jsonforms/vue'

const jsonSchema = {
  type: 'object',
  properties: {
    acceptTerms: {
      type: 'boolean',
      title: 'I accept the terms and conditions'
    },
    username: { type: 'string', title: 'Username', default: 'a' },
    color: {
      type: 'string',
      title: 'Favorite Color',
      enum: ['red', 'green', 'blue']
    }
  }
}

const paramsFormState = ref<JsonFormsChangeEvent>()
const onParamsFormChange = (e: JsonFormsChangeEvent) => {
  paramsFormState.value = e
  console.log(JSON.stringify(e))
}
</script>
