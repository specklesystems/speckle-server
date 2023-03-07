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
    </DisclosurePanel>
  </Disclosure>
</template>
<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { ChevronUpIcon } from '@heroicons/vue/24/solid'
import { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { useDeleteProject } from '~~/lib/projects/composables/projectManagement'

const props = defineProps<{
  project: ProjectPageTeamDialogFragment
}>()

const deleteProject = useDeleteProject()

const typedProjectName = ref('')
const isProjectNameTyped = computed(() => typedProjectName.value === props.project.name)

const onDelete = async () => {
  if (!isProjectNameTyped.value) return
  await deleteProject(props.project.id, { goHome: true })
}
</script>
