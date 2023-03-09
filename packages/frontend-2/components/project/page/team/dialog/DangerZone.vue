<template>
  <Disclosure v-slot="{ open }">
    <DisclosureButton class="py-2 flex justify-between items-center text-danger">
      <div class="inline-flex items-center h6 space-x-4">
        <ExclamationTriangleIcon class="h-6 w-6" />
        <span class="relative bottom-0.5">Danger zone</span>
      </div>
      <ChevronUpIcon :class="!open ? 'rotate-180 transform' : ''" class="h-4 w-4" />
    </DisclosureButton>
    <DisclosurePanel class="flex flex-col space-y-2">
      <template v-if="isOwner">
        <div class="h7 font-bold">Delete project</div>
        <div class="label label--light">
          Deleting a project is an irreversible action! If you are sure you want to
          proceed, please type in the project name
          <span class="font-bold">{{ project.name }}</span>
          in the input field and press "Delete".
        </div>
        <div class="flex space-x-2">
          <FormTextInput
            v-model="typedProjectName"
            name="deleteProject"
            placeholder="Project name"
            full-width
          />
          <FormButton color="danger" :disabled="!isProjectNameTyped" @click="onDelete">
            Delete
          </FormButton>
        </div>
      </template>
      <template v-if="canLeaveProject">
        <div class="h7 font-bold">Leave project</div>
        <div class="flex flex-col space-y-2">
          <div class="label label--light">
            As long as you're not the only owner you can remove yourself from this
            project's list of collaborators.
            <br />
            Removing yourself from the collaborators list is an irreversible action and
            the only way you can get back on the list is if a project owner invites you
            back
          </div>
          <FormButton class="self-end" @click="onLeave">Leave</FormButton>
        </div>
      </template>
    </DisclosurePanel>
  </Disclosure>
</template>
<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { ChevronUpIcon } from '@heroicons/vue/24/solid'
import { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import {
  useDeleteProject,
  useLeaveProject
} from '~~/lib/projects/composables/projectManagement'
import { useTeamDialogInternals } from '~~/lib/projects/composables/team'

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const { isOwner, canLeaveProject } = useTeamDialogInternals({ props: toRefs(props) })
const deleteProject = useDeleteProject()
const leaveProject = useLeaveProject()

const typedProjectName = ref('')
const isProjectNameTyped = computed(() => typedProjectName.value === props.project.name)

const onDelete = async () => {
  if (!isProjectNameTyped.value || !isOwner.value) return
  await deleteProject(props.project.id, { goHome: true })
}

const onLeave = async () => {
  if (!canLeaveProject.value) return
  await leaveProject(props.project.id, { goHome: true })
}
</script>
