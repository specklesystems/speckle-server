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
import { isRequired, isStringOfLength } from '~~/lib/common/helpers/validation'
import type { LayoutDialogButton } from '@speckle/ui-components'
import { useUpdateDashboard } from '~/lib/dashboards/composables/management'
import { graphql } from '~~/lib/common/generated/gql'
import type { DashboardsEditDialog_DashboardFragment } from '~~/lib/common/generated/graphql'

graphql(`
  fragment DashboardsEditDialog_Dashboard on Dashboard {
    id
    name
    workspace {
      id
    }
  }
`)

const props = defineProps<{
  dashboard: DashboardsEditDialog_DashboardFragment
}>()

const open = defineModel<boolean>('open', { required: true })

const updateDashboard = useUpdateDashboard()

const dashboardName = ref()

watch(open, (newValue, oldValue) => {
  if (newValue && !oldValue) {
    dashboardName.value = props.dashboard.name
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
  if (!props.dashboard.id || !props.dashboard.workspace.id) return

  await updateDashboard(
    {
      id: props.dashboard.id,
      name: dashboardName.value
    },
    props.dashboard.workspace.id
  )
  open.value = false
}
</script>
