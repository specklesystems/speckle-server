<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Delete Project</template>
    <div class="space-y-4">
      <p>Are you sure you want to leave this project?</p>
      <p class="font-bold my-2">
        Leaving this project removes your access to its data and functionalities.
      </p>
      <p>You can only rejoin if invited back by a project owner.</p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog } from '@speckle/ui-components'
import { useLeaveProject } from '~~/lib/projects/composables/projectManagement'
import type { ProjectSettingsQuery } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useTeamInternals } from '~~/lib/projects/composables/team'

const isOpen = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  project: ProjectSettingsQuery['project']
}>()

const leaveProject = useLeaveProject()
const mp = useMixpanel()

const projectData = computed(() => props.project)

const dialogButtons = computed(() => [
  {
    text: 'Cancel',
    props: { color: 'secondary', fullWidth: true, outline: true },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Leave',
    props: {
      color: 'danger',
      fullWidth: true,
      outline: true,
      submit: true
    },
    onClick: onLeave
  }
])

const { canLeaveProject } = useTeamInternals(projectData)

const onLeave = async () => {
  if (!canLeaveProject.value) return
  await leaveProject(props.project.id, { goHome: true })
  mp.track('Stream Action', { type: 'action', name: 'leave' })
}
</script>
