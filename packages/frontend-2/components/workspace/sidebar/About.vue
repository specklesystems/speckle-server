<template>
  <div class="px-4 py-2">
    <LayoutSidebarMenuGroup
      title="About"
      collapsible
      :icon="iconName"
      :icon-click="iconClick"
      :icon-text="iconText"
      no-hover
    >
      <div
        class="flex flex-col gap-4 text-body-2xs text-foreground-2 pb-0 lg:pb-4 mt-1"
      >
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
            <FormButton size="sm" color="outline" @click="cancelEdit">
              Cancel
            </FormButton>
          </div>
        </div>
        <template v-else>
          <div class="whitespace-pre-wrap">
            {{ workspace?.description || 'No workspace description' }}
          </div>
          <FormButton
            v-if="!workspace?.description && isWorkspaceAdmin"
            color="outline"
            size="sm"
            @click="startEdit"
          >
            Add description
          </FormButton>
        </template>
      </div>
    </LayoutSidebarMenuGroup>
  </div>
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
import type { MaybeNullOrUndefined } from '@speckle/shared'

graphql(`
  fragment WorkspaceSidebarAbout_Workspace on Workspace {
    id
    name
    description
  }
`)

const props = defineProps<{
  workspace: MaybeNullOrUndefined<WorkspaceSidebarAbout_WorkspaceFragment>
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
  return props.workspace?.description ? 'edit' : 'add'
})

const iconClick = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  if (isEditing.value) return undefined
  return () => startEdit()
})

const iconText = computed(() => {
  if (!props.isWorkspaceAdmin) return undefined
  if (isEditing.value) return undefined
  return props.workspace?.description ? 'Edit description' : 'Add description'
})

const startEdit = () => {
  editedDescription.value = props.workspace?.description || ''
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editedDescription.value = ''
}

const saveDescription = async () => {
  if (!props.workspace?.id) return

  const result = await updateMutation({
    input: {
      id: props.workspace?.id,
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
      workspace_id: props.workspace?.id,
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
