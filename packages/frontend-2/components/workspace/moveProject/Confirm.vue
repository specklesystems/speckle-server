<template>
  <div>
    <BillingTransitionCards
      :current-state="transitionItems.project"
      :new-state="transitionItems.workspace"
    >
      <template #current-state>
        <div class="flex flex-col">
          <div class="text-foreground-2 text-body-3xs">Project</div>
          <div class="flex items-center gap-4 justify-between">
            <div class="text-heading-sm mt-1">{{ project.name }}</div>
            <div class="text-body-2xs font-medium">
              {{ project.modelCount.totalCount }} models
            </div>
          </div>
        </div>
      </template>
      <template #new-state>
        <div class="flex flex-col">
          <div class="text-foreground-2 text-body-3xs">Workspace</div>
          <div class="text-heading-sm mt-1">{{ workspace.name }}</div>
        </div>
      </template>
    </BillingTransitionCards>
    <div class="flex flex-col gap-y-4">
      <p class="text-body-2xs text-foreground-2 mt-4">
        The project, including all its data, will be moved to the workspace, where all
        existing members will have access by default.
      </p>

      <div
        v-if="dryRunResultMembers.length > 0"
        class="pt-2 gap-y-2 flex flex-col border-t border-outline-3"
      >
        <p class="text-body-2xs text-foreground-2 mt-2 mb-1">
          {{
            dryRunResultMembers.length === 1
              ? '1 person will also be added as a free member to the workspace.'
              : `${dryRunResultMembers.length} people will also be added as free members to the workspace.`
          }}
        </p>
        <div class="w-full">
          <div
            v-for="user in dryRunResultMembers"
            :key="`dry-run-user-${user.id}`"
            class="flex items-center py-1.5 px-2 border-t border-x last:border-b border-outline-3 first:rounded-t-lg last:rounded-b-lg gap-x-1.5"
          >
            <UserAvatar hide-tooltip :user="user" size="sm" />
            <p class="text-foreground text-body-2xs">{{ user.name }}</p>
          </div>
        </div>
        <p v-if="dryRunResultMembersInfoText" class="text-body-2xs text-foreground-2">
          {{ dryRunResultMembersInfoText }}
        </p>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <FormButton color="outline" @click="$emit('back')">Back</FormButton>
        <FormButton color="primary" @click="triggerAction">Move</FormButton>
      </div>
    </div>
    <WorkspaceRegionStaticDataDisclaimer
      v-if="showRegionStaticDataDisclaimer"
      v-model:open="showRegionStaticDataDisclaimer"
      :variant="RegionStaticDataDisclaimerVariant.MoveProjectIntoWorkspace"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  WorkspaceMoveProjectManager_ProjectFragment,
  WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
} from '~~/lib/common/generated/gql/graphql'
import { useQuery } from '@vue/apollo-composable'
import { moveToWorkspaceDryRunQuery } from '~/lib/projects/graphql/queries'
import { useMoveProjectToWorkspace } from '~/lib/projects/composables/projectManagement'
import {
  useWorkspaceCustomDataResidencyDisclaimer,
  RegionStaticDataDisclaimerVariant
} from '~/lib/workspaces/composables/region'

const props = defineProps<{
  project: WorkspaceMoveProjectManager_ProjectFragment
  workspace: WorkspaceMoveProjectSelectWorkspace_WorkspaceFragment
  eventSource?: string
}>()

const emit = defineEmits<{
  (e: 'move-complete'): void
  (e: 'back'): void
}>()

const moveProject = useMoveProjectToWorkspace()

const handleConfirm = async () => {
  const res = await moveProject({
    projectId: props.project.id,
    workspaceId: props.workspace.id,
    workspaceName: props.workspace.name,
    eventSource: props.eventSource
  })
  if (res?.id) {
    emit('move-complete')
  }
}

const { showRegionStaticDataDisclaimer, triggerAction } =
  useWorkspaceCustomDataResidencyDisclaimer({
    workspace: computed(() => props.workspace),
    onConfirmAction: handleConfirm
  })

const { result: dryRunResult } = useQuery(
  moveToWorkspaceDryRunQuery,
  () => ({
    projectId: props.project.id,
    workspaceId: props.workspace.id,
    limit: 20
  }),
  () => ({
    enabled: !!props.project.id && !!props.workspace.id
  })
)

const dryRunResultMembers = computed(
  () => dryRunResult.value?.project.moveToWorkspaceDryRun.addedToWorkspace || []
)
const dryRunResultMembersCount = computed(
  () => dryRunResult.value?.project.moveToWorkspaceDryRun.addedToWorkspaceTotalCount
)
const dryRunResultMembersInfoText = computed(() => {
  if (!dryRunResultMembers.value || !dryRunResultMembersCount.value) return ''

  if (dryRunResultMembers.value?.length > 20 && dryRunResultMembersCount.value > 20) {
    const diff = dryRunResultMembersCount.value - dryRunResultMembers.value.length
    return `and ${diff} more`
  }

  return ''
})

const transitionItems = {
  project: {
    title: 'Viewer seat',
    description: 'Can view and comment on projects'
  },
  workspace: {
    title: 'Editor seat',
    description: 'Can view and comment on projects'
  }
} as const

defineExpose({
  onConfirm: triggerAction
})
</script>
