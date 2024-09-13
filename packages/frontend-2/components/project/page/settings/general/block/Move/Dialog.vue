<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Move project</template>
    <div class="space-y-4 text-body-xs">
      <div class="text-body-xs text-foreground flex flex-col gap-y-4">
        <p>
          Are you sure you want to
          <span class="font-medium">move</span>
          the selected project?
        </p>
        <div class="rounded border bg-foundation-2 border-outline-3 py-2 px-4">
          <p>
            Move
            <span class="font-medium">{{ project.name }}</span>
            to
            <span class="font-medium">{{ workspace.name }}</span>
          </p>
          <p>
            {{ project.models.totalCount }} {{ modelText }},
            {{ project.versions.totalCount }} {{ versionsText }}
          </p>
        </div>

        <p class="text-body-2xs text-foreground-2">
          The projects, including all models and their versions, will be moved to the
          target workspace. All target workspace members and admins will have access to
          the project. Also:
          <span class="pt-2 block">
            - Project collaborators that are server guests, will become guests in the
            target workspace and retain project roles.
          </span>
          <span class="pt-2 block">
            - All other project collaborators will become workspace members in the
            target workspace and will retain their existing project roles.
          </span>
        </p>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { type LayoutDialogButton } from '@speckle/ui-components'
import type {
  ProjectPageSettingsGeneralBlockMove_ProjectFragment,
  ProjectPageSettingsGeneralBlockMove_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~/lib/core/composables/mp'

const isOpen = defineModel<boolean>('open', { required: true })
const props = defineProps<{
  project: ProjectPageSettingsGeneralBlockMove_ProjectFragment
  workspace: ProjectPageSettingsGeneralBlockMove_WorkspaceFragment
}>()

const mixpanel = useMixpanel()

const modelText = computed(() =>
  props.project.models.totalCount === 1 ? 'model' : 'models'
)
const versionsText = computed(() =>
  props.project.versions.totalCount === 1 ? 'version' : 'versions'
)

const dialogButtons = computed<LayoutDialogButton[]>(() => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Move',
    props: {
      color: 'primary'
    },
    onClick: () => {
      mixpanel.track('Project Moved To Workspace', {
        projectId: props.project.id,
        // eslint-disable-next-line camelcase
        workspace_id: props.workspace.id
      })
    }
  }
])
</script>
