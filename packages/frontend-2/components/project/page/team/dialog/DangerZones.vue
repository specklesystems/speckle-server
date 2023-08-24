<template>
  <div class="space-y-4">
    <div
      v-if="canLeaveProject"
      class="border-l-2 border-danger pl-2 rounded transition hover:bg-red-500/10"
    >
      <Disclosure>
        <DisclosureButton class="pr-3 text-danger h-10 w-full flex items-center">
          <div class="inline-flex items-center space-x-4">
            <ArrowRightOnRectangleIcon class="h-4 w-4" />
            <span>Leave Project</span>
          </div>
        </DisclosureButton>
        <DisclosurePanel class="flex flex-col space-y-4 pb-2">
          <div class="flex flex-col space-y-2">
            <div class="label label--light">
              As long as you're not the only owner you can remove yourself from this
              project's list of collaborators.
              <b>
                Removing yourself from the collaborators list is an irreversible action
              </b>
              and the only way you can get back on the list is if a project owner
              invites you back.
            </div>
            <FormButton color="danger" size="sm" class="self-start" @click="onLeave">
              Leave
            </FormButton>
          </div>
        </DisclosurePanel>
      </Disclosure>
    </div>
    <div
      v-if="isOwner && !isServerGuest"
      class="border-l-2 border-danger px-2 rounded transition hover:bg-red-500/10"
    >
      <Disclosure>
        <DisclosureButton class="pr-3 text-danger h-10 w-full flex items-center">
          <div class="inline-flex items-center space-x-4">
            <TrashIcon class="h-4 w-4" />
            <span>Delete Project</span>
          </div>
        </DisclosureButton>
        <DisclosurePanel class="flex flex-col space-y-4">
          <form class="flex flex-col space-y-2 pb-2" @submit="onDelete">
            <div class="label label--light">
              Deleting a project is an irreversible action! If you are sure you want to
              proceed, please type in the project name
              <span class="font-bold">{{ project.name }}</span>
              in the input field and press "Delete".
            </div>
            <div class="flex space-x-2">
              <FormTextInput
                name="projectName"
                label="Project name"
                size="sm"
                placeholder="Project name"
                :rules="[stringMatchesProjectName]"
                full-width
                validate-on-mount
                validate-on-value-update
                hide-error-message
              />
            </div>
            <FormButton
              color="danger"
              size="sm"
              :disabled="!!Object.values(deleteErrors).length"
              class="self-start"
              submit
            >
              Delete
            </FormButton>
          </form>
        </DisclosurePanel>
      </Disclosure>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { TrashIcon, ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
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
