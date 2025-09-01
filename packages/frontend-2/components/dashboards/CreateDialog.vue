<template>
  <LayoutDialog
    v-model:open="open"
    title="Create new dashboard"
    :buttons="dialogButtons"
    :on-submit="onSubmit"
    max-width="xs"
  >
    <FormTextInput
      v-model="dashboardName"
      name="name"
      label="Dashboard name"
      placeholder="Name"
      color="foundation"
      :rules="[isRequired, isStringOfLength({ maxLength: 512 })]"
      auto-focus
      autocomplete="off"
      show-label
      class="mb-2"
    />
  </LayoutDialog>
</template>

<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useCreateDashboard } from '~/lib/dashboards/composables/management'

const props = defineProps<{
  workspaceSlug?: MaybeNullOrUndefined<string>
}>()

const open = defineModel<boolean>('open', { required: true })

const createDashboard = useCreateDashboard()

const dashboardName = ref('')

watch(open, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    dashboardName.value = ''
  }
})

const dialogButtons = computed((): LayoutDialogButton[] => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => (open.value = false)
  },
  {
    text: 'Create',
    props: {
      submit: true
    },
    onClick: () => {
      open.value = false
    }
  }
])

const onSubmit = async () => {
  await createDashboard({
    identifier: { slug: props.workspaceSlug },
    input: { name: dashboardName.value }
  })
  open.value = false
}
</script>
