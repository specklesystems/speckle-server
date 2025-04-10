<template>
  <div>
    <CommonCard class="!p-3 !bg-foundation mb-4">
      <div class="flex flex-col sm:flex-row sm:gap-2 text-foreground">
        <ExclamationCircleIcon class="h-8 w-8 m-1 text-warning shrink-0" />
        <div class="flex flex-col gap-4">
          <h3 class="text-heading mt-2">
            {{
              projectId
                ? `Move this project to a workspace or it will be deleted in (count) days.`
                : `Move projects to a workspace or they will be deleted in (count) days.`
            }}
          </h3>

          <div class="text-body-xs max-w-3xl">
            <p>
              In our continuous effort to improve user experience, we are excited to
              announce the rollout of several new features designed to simplify your
              workflow and enhance navigation. Important facts:
            </p>
            <ul class="list-disc list-inside pl-2">
              <li>These updates will include customizable dashboards,</li>
              <li>Improved search functionality,</li>
              <li>And a more user-friendly interface</li>
            </ul>
          </div>

          <div class="flex gap-2 mt-2 mb-3">
            <FormButton v-if="projectId" @click="onMoveProject">
              Move project
            </FormButton>
            <FormButton v-else @click="onShowProjectsToMove">
              Show projects to move
            </FormButton>
            <FormButton
              color="outline"
              :to="LearnMoreMoveProjectsUrl"
              external
              target="_blank"
            >
              Learn more
            </FormButton>
          </div>
        </div>
      </div>
    </CommonCard>
    <ProjectsMoveToWorkspaceDialog
      v-model:open="showMoveToWorkspaceDialog"
      :project="selectedProject"
      event-source="move-to-workspace-alert"
    />
    <WorkspaceMoveProjectsDialog v-model:open="showMoveProjectsDialog" />
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { LearnMoreMoveProjectsUrl } from '~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'
import type { ProjectsMoveToWorkspaceDialog_ProjectFragment } from '~~/lib/common/generated/gql/graphql'
import { moveToWorkspaceAlertQuery } from '~/lib/workspaces/graphql/queries'

graphql(`
  fragment MoveToWorkspaceAlert_Project on Project {
    ...ProjectsMoveToWorkspaceDialog_Project
  }
`)

const props = defineProps<{
  projectId?: string
}>()

const showMoveToWorkspaceDialog = ref(false)
const showMoveProjectsDialog = ref(false)
const selectedProject = ref<ProjectsMoveToWorkspaceDialog_ProjectFragment | undefined>(
  undefined
)

const { result } = useQuery(
  moveToWorkspaceAlertQuery,
  () => ({
    id: props.projectId || ''
  }),
  () => ({
    enabled: !!props.projectId
  })
)

const onMoveProject = () => {
  if (!props.projectId) return
  selectedProject.value = result.value?.project
  showMoveToWorkspaceDialog.value = true
}

const onShowProjectsToMove = () => {
  selectedProject.value = undefined
  showMoveProjectsDialog.value = true
}
</script>
