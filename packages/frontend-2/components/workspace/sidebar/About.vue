<template>
  <LayoutSidebarMenuGroup
    :title="collapsible ? 'About' : undefined"
    :collapsible="collapsible"
    :icon="iconName"
    :icon-click="iconClick"
    :icon-text="iconText"
    no-hover
  >
    <div class="flex flex-col gap-4 text-body-2xs text-foreground-2 pb-0 lg:pb-4 mt-1">
      <div v-if="isEditing">
        <FormTextArea
          v-model="editedDescription"
          color="foundation"
          size="sm"
          name="Workspace description"
          placeholder="Workspace description"
          :rules="[isStringOfLength({ maxLength: 512 })]"
          validate-on-value-update
          @keyup.enter="saveDescription"
          @keyup.esc="cancelEdit"
        />
        <div class="flex gap-1 mt-2">
          <FormButton size="sm" color="primary" @click="saveDescription">
            Save
          </FormButton>
          <FormButton size="sm" color="outline" @click="cancelEdit">Cancel</FormButton>
        </div>
      </div>
      <template v-else>
        {{ workspaceInfo.description || 'No workspace description' }}
        <FormButton
          v-if="!workspaceInfo.description && isWorkspaceAdmin"
          color="outline"
          size="sm"
          @click="startEdit"
        >
          Add description
        </FormButton>
      </template>
    </div>
  </LayoutSidebarMenuGroup>
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useMutation } from '@vue/apollo-composable'
import { settingsUpdateWorkspaceMutation } from '~/lib/settings/graphql/mutations'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  getFirstErrorMessage,
  convertThrowIntoFetchResult
} from '~~/lib/common/helpers/graphql'
import { isStringOfLength } from '~~/lib/common/helpers/validation'
import type { WorkspaceSidebarAbout_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'

graphql(`
  fragment WorkspaceSidebarAbout_Workspace on Workspace {
    ...WorkspaceDashboardAbout_Workspace
  }
`)

const props = defineProps<{
  workspaceInfo: WorkspaceSidebarAbout_WorkspaceFragment
  collapsible?: boolean
  isWorkspaceAdmin?: boolean
}>()

const { triggerNotification } = useGlobalToast()
const { mutate: updateMutation } = useMutation(settingsUpdateWorkspaceMutation)
const mixpanel = useMixpanel()

const isEditing = ref(false)
const editedDescription = ref('')

const iconName = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  if (isEditing.value) return undefined
  return props.workspaceInfo.description ? 'edit' : 'add'
})

const iconClick = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  if (isEditing.value) return undefined
  return () => startEdit()
})

const iconText = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  if (isEditing.value) return undefined
  return props.workspaceInfo.description ? 'Edit description' : 'Add description'
})

const startEdit = () => {
  editedDescription.value = props.workspaceInfo.description || ''
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editedDescription.value = ''
}

const saveDescription = async () => {
  const result = await updateMutation({
    input: {
      id: props.workspaceInfo.id,
      description: editedDescription.value
    }
  }).catch(convertThrowIntoFetchResult)

  if (result?.data) {
    triggerNotification({
      type: ToastNotificationType.Success,
      title: 'Description updated'
    })
    mixpanel.track('Workspace General Settings Updated', {
      fields: ['description'],
      // eslint-disable-next-line camelcase
      workspace_id: props.workspaceInfo.id,
      source: 'sidebar'
    })
    isEditing.value = false
  } else {
    const errorMessage = getFirstErrorMessage(result?.errors)
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'Failed to update description',
      description: errorMessage
    })
  }
}
</script>
