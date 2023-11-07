<template>
  <form class="flex flex-col space-y-4 form-json-form">
    <!-- <JsonForms
      ref="internalRef"
      :renderers="renderers"
      :schema="jsonSchema"
      :uischema="uiSchema"
      :data="data"
      @change="onChange"
    /> -->
    <span>test</span>
  </form>
</template>

<script setup lang="ts">
// import { JsonForms, JsonFormsChangeEvent } from '@jsonforms/vue'
// import { renderers } from '~/lib/form/jsonRenderers'
//defineEmitsimport { useForm } from 'vee-validate'

// type DataType = Record<string, unknown>

// const emit = defineEmits<(e: 'change', val: JsonFormsChangeEvent) => void>()

// const data = ref({})

// const jsonSchema = {
//   type: 'object',
//   properties: {
//     acceptTerms: { type: 'boolean', title: 'I accept the terms and conditions' },
//     username: { type: 'string', title: 'Username' },
//     color: {
//       type: 'string',
//       title: 'Favorite Color',
//       enum: ['red', 'green', 'blue']
//     }
//   }
// }

// const uiSchema = {
//   type: 'VerticalLayout',
//   elements: [
//     { type: 'Control', scope: '#/properties/acceptTerms' },
//     { type: 'Control', scope: '#/properties/username' },
//     {
//       type: 'Control',
//       scope: '#/properties/color',
//       options: { format: 'dropdown' }
//     }
//   ]
// }

// const { validate } = useForm()

// const onChange = async (e: JsonFormsChangeEvent) => {
//   // console.log(JSON.parse(JSON.stringify(e)))
//   data.value = e.data as DataType
//   await validate({ mode: 'force' })
//   emit('change', e)
// }
</script>
