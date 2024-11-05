<template>
  <LayoutDialog
    v-model:open="open"
    max-width="sm"
    :buttons="dialogButtons"
    hide-closer
    prevent-close-on-click-outside
    :on-submit="onSubmit"
  >
    <template #header>Create a new region</template>
    <div class="flex flex-col gap-y-4 mb-2">
      <FormTextInput
        name="name"
        label="Region name"
        placeholder="Name"
        color="foundation"
        :rules="[isRequired, isStringOfLength({ maxLength: 64 })]"
        auto-focus
        autocomplete="off"
        show-required
        show-label
        help="Human readable name for the region."
      />
      <FormTextArea
        name="description"
        label="Region description"
        placeholder="Description"
        color="foundation"
        size="lg"
        show-label
        show-optional
        :rules="[isStringOfLength({ maxLength: 65536 })]"
      />
      <SettingsServerRegionsKeySelect
        show-label
        name="key"
        :items="availableRegionKeys"
        label="Region key"
        :rules="[isRequired]"
        show-required
        help="These keys come from the server multi region configuration file."
      />
    </div>
  </LayoutDialog>
</template>
<script lang="ts" setup>
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type { SettingsServerRegionsAddEditDialog_ServerRegionItemFragment } from '~/lib/common/generated/gql/graphql'
import { useForm } from 'vee-validate'
import {
  useCreateRegion,
  useUpdateRegion
} from '~/lib/multiregion/composables/management'
import { useMutationLoading } from '@vue/apollo-composable'

graphql(`
  fragment SettingsServerRegionsAddEditDialog_ServerRegionItem on ServerRegionItem {
    id
    name
    description
    key
  }
`)

type ServerRegionItem = SettingsServerRegionsAddEditDialog_ServerRegionItemFragment
type DialogModel = Omit<ServerRegionItem, 'id'>

defineProps<{
  availableRegionKeys: string[]
}>()

const open = defineModel<boolean>('open', { required: true })
const model = defineModel<DialogModel>()
const { handleSubmit, setValues } = useForm<DialogModel>()
const createRegion = useCreateRegion()
const updateRegion = useUpdateRegion()
const loading = useMutationLoading()

const dialogButtons = computed((): LayoutDialogButton[] => {
  return [
    {
      text: 'Cancel',
      props: { color: 'outline' },
      onClick: () => (open.value = false)
    },
    {
      text: isEditMode.value ? 'Update' : 'Create',
      props: {
        submit: true,
        disabled: loading.value
      },
      onClick: noop
    }
  ]
})
const isEditMode = computed(() => !!model.value)

const onSubmit = handleSubmit(async (values) => {
  const action = isEditMode.value ? updateRegion : createRegion
  const res = await action({
    input: {
      key: values.key,
      name: values.name,
      description: values.description
    }
  })

  if (res?.id) {
    open.value = false
  }
})

watch(
  model,
  (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
      setValues(newVal)
    } else if (!newVal && oldVal) {
      setValues({ name: '', description: '', key: '' })
    }
  },
  { immediate: true }
)
</script>
