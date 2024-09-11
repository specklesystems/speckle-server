<template>
  <LayoutDialog v-model:open="isOpen" max-width="md" :buttons="dialogButtons">
    <template #header>Leave project</template>
    <div class="space-y-4">
      <p>Are you sure you want to leave this project?</p>
      <p class="font-medium my-2">
        Leaving this project removes your access to its data and functionalities.
      </p>
      <p>You can only rejoin if invited back by a project owner.</p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { LayoutDialog, type LayoutDialogButton } from '@speckle/ui-components'
import { useLeaveProject } from '~~/lib/projects/composables/projectManagement'
import { useMixpanel } from '~~/lib/core/composables/mp'
import type { ProjectPageSettingsGeneralBlockLeave_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

const isOpen = defineModel<boolean>('open', { required: true })

const props = defineProps<{
  project: ProjectPageSettingsGeneralBlockLeave_ProjectFragment
}>()

const leaveProject = useLeaveProject()
const mp = useMixpanel()

const dialogButtons = computed<LayoutDialogButton[]>(() => [
  {
    text: 'Cancel',
    props: { color: 'outline' },
    onClick: () => {
      isOpen.value = false
    }
  },
  {
    text: 'Leave',
    props: {
      color: 'danger',

      submit: true
    },
    onClick: onLeave
  }
])

const onLeave = async () => {
  await leaveProject(props.project.id, { goHome: true })
  mp.track('Stream Action', {
    type: 'action',
    name: 'leave',
    // eslint-disable-next-line camelcase
    workspace_id: props.project.workspace?.id
  })
}
</script>
