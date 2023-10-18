<template>
  <div>
    <LayoutDialogSection
      v-if="canLeaveProject"
      border-b
      title="Leave Project"
      :icon="ArrowRightOnRectangleIcon"
      :button="{
        text: 'Leave Project',
        color: 'info',
        expandContent: true,
        iconRight: ChevronDownIcon
      }"
    >
      <div
        class="flex items-center gap-4 py-3 px-4 bg-info-lighter rounded-md select-none mb-4"
      >
        <div>
          <ExclamationTriangleIcon class="mt-0.5 h-12 w-12 text-info" />
        </div>
        <div>
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

    <LayoutDialogSection
      v-if="isOwner && !isServerGuest"
      title="Delete Project"
      :icon="TrashIcon"
      :button="{
        text: 'Delete Project',
        color: 'danger',
        expandContent: true,
        iconRight: ChevronDownIcon
      }"
    >
      <div
        class="flex items-center gap-4 py-3 px-4 bg-danger-lighter rounded-md select-none mb-4"
      >
        <div>
          <ExclamationTriangleIcon class="mt-0.5 h-12 w-12 text-danger" />
        </div>
        <div>
          <p class="font-semibold text-danger-darker">
            Deleting a project is an irreversible action!
          </p>
          <p class="text-sm">
            If you are sure you want to proceed, please type in the project name
            <strong>{{ project.name }}</strong>
            in the input field and press "Delete".
          </p>
        </div>
      </div>
      <form class="flex flex-col space-y-2 pb-2" @submit="onDelete">
        <FormTextInput
          name="projectName"
          label="Project name"
          placeholder="Project name"
          :rules="[stringMatchesProjectName]"
          full-width
          size="lg"
          validate-on-mount
          validate-on-value-update
          hide-error-message
          class="text-sm"
        />
        <div class="flex gap-2 mt-4">
          <FormButton
            submit
            :disabled="!!Object.values(deleteErrors).length"
            color="danger"
          >
            Delete
          </FormButton>
        </div>
      </form>
    </LayoutDialogSection>
  </div>
</template>
<script setup lang="ts">
import {
  TrashIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'
import { LayoutDialogSection } from '@speckle/ui-components'
import { GenericValidateFunction, useForm } from 'vee-validate'
import { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import {
  useDeleteProject,
  useLeaveProject
} from '~~/lib/projects/composables/projectManagement'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'

const stringMatchesProjectName: GenericValidateFunction<string> = (val: string) => {
  return val === props.project.name ? true : 'Value must match the project name exactly'
}

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const { handleSubmit: handleDeleteSubmit, errors: deleteErrors } = useForm<{
  projectName: string
}>()

const { isOwner, canLeaveProject, isServerGuest } = useTeamDialogInternals({
  props: toRefs(props)
})
const deleteProject = useDeleteProject()
const leaveProject = useLeaveProject()
const mp = useMixpanel()

const onDelete = handleDeleteSubmit(async () => {
  if (!isOwner.value) return
  await deleteProject(props.project.id, { goHome: true })
  mp.track('Stream Action', { type: 'action', name: 'delete' })
})

const onLeave = async () => {
  if (!canLeaveProject.value) return
  await leaveProject(props.project.id, { goHome: true })
  mp.track('Stream Action', { type: 'action', name: 'leave' })
}
</script>
