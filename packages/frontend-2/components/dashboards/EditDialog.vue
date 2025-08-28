<template>
  <LayoutDialog
    v-model:open="open"
    title="Edit dashboard"
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
import { useUpdateDashboard } from '~/lib/dashboards/composables/management'

const props = defineProps<{
  dashboardId?: MaybeNullOrUndefined<string>
  name: MaybeNullOrUndefined<string>
}>()

const open = defineModel<boolean>('open', { required: true })

const updateDashboard = useUpdateDashboard()

const dashboardName = ref()

watch(open, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    dashboardName.value = props.name
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
    }
  }
])

const onSubmit = async () => {
  if (!props.dashboardId) return

  await updateDashboard({
    id: props.dashboardId,
    name: dashboardName.value
  })
  open.value = false
}
</script>
