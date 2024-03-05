<template>
  <LayoutDialogSection
    v-if="canLeaveProject"
    border-b
    title="Leave Project"
    title-color="info"
    enlarged
    always-open
  >
    <template #icon>
      <ArrowRightOnRectangleIcon class="h-full w-full" />
    </template>
    <div
      class="flex flex-col sm:flex-row sm:items-center gap-4 py-3 px-4 bg-info-lighter rounded-md select-none mb-4 text-info-darker text-sm"
    >
      <div>
        <ExclamationTriangleIcon class="mt-0.5 h-12 w-12 text-info" />
      </div>
      <div class="">
        <p class="text-sm">
          As long as you're not the only owner you can remove yourself from this
          project's list of collaborators.
        </p>
        <p class="font-semibold text-info-darker py-2">
          Removing yourself from the collaborators list is an irreversible action.
        </p>
        <p class="text-sm">
          The only way you can get back on the list is if a project owner invites you
          back.
        </p>
      </div>
    </div>
    <div class="flex gap-2 mt-4">
      <FormButton color="info" class="text-sm self-start" @click="onLeave">
        Leave
      </FormButton>
    </div>
  </LayoutDialogSection>
</template>
<script setup lang="ts">
import {
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { LayoutDialogSection } from '@speckle/ui-components'
import type { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useLeaveProject } from '~~/lib/projects/composables/projectManagement'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const { canLeaveProject } = useTeamDialogInternals({
  props: toRefs(props)
})
const leaveProject = useLeaveProject()
const mp = useMixpanel()

const onLeave = async () => {
  if (!canLeaveProject.value) return
  await leaveProject(props.project.id, { goHome: true })
  mp.track('Stream Action', { type: 'action', name: 'leave' })
}
</script>
