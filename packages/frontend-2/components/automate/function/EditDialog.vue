<template>
  <LayoutDialog
    v-model:open="open"
    title="Edit function"
    :buttons="buttons"
    max-width="md"
    buttons-wrapper-classes="justify-between"
    :on-submit="onSubmit"
    prevent-close-on-click-outside
  >
    <AutomateFunctionCreateDialogDetailsStep />
  </LayoutDialog>
</template>
<script setup lang="ts">
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useMutationLoading } from '@vue/apollo-composable'
import { difference, differenceBy } from 'lodash-es'
import { useForm } from 'vee-validate'
import { useUpdateAutomateFunction } from '~/lib/automate/composables/management'
import type { FunctionDetailsFormValues } from '~/lib/automate/helpers/functions'

const props = defineProps<{
  model: FunctionDetailsFormValues
  fnId: string
}>()
const open = defineModel<boolean>('open', { required: true })
const { handleSubmit, setValues } = useForm<FunctionDetailsFormValues>()
const mutationLoading = useMutationLoading()
const updateFunction = useUpdateAutomateFunction()

const buttons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: {
      color: 'outline',
      class: '!text-primary'
    },
    onClick: () => (open.value = false)
  },
  {
    text: 'Save',
    submit: true,
    disabled: mutationLoading.value
  }
])

const onSubmit = handleSubmit(async (values) => {
  const res = await updateFunction({
    input: {
      id: props.fnId,
      name: values.name !== props.model.name ? values.name : null,
      description:
        values.description !== props.model.description ? values.description : null,
      logo: values.image !== props.model.image ? values.image : null,
      tags: difference(values.tags, props.model.tags || []).length ? values.tags : null,
      supportedSourceApps: differenceBy(
        values.allowedSourceApps,
        props.model.allowedSourceApps || [],
        (i) => i.name
      )
        ? (values.allowedSourceApps || []).map((a) => a.name)
        : null
    }
  })

  if (res?.id) {
    open.value = false
  }
})

const reset = () => {
  // Temp hack while FormSelectBase has a bug where it rewrites form value with initialValue
  nextTick(() => {
    setValues(props.model)
  })
}

watch(
  () => props.model,
  () => {
    reset()
  },
  { immediate: true }
)

watch(open, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    reset()
  }
})
</script>
