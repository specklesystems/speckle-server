<template>
  <LayoutDialogSection
    v-if="isOwner && !isServerGuest"
    title="Delete Project"
    title-color="danger"
    enlarged
    always-open
  >
    <template #icon>
      <TrashIcon class="h-full w-full" />
    </template>
    <div
      class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 px-4 bg-danger-lighter dark:bg-danger-darker rounded-md select-none mb-4"
    >
      <div>
        <ExclamationTriangleIcon class="mt-0.5 h-12 w-12 text-danger" />
      </div>
      <div>
        <p class="font-semibold text-danger-darker dark:text-danger-lighter">
          Deleting a project is an irreversible action!
        </p>
        <p class="text-sm">
          If you are sure you want to proceed, please type in the project name
          <strong>{{ project.name }}</strong>
          in the input field and press "Delete".
        </p>
      </div>
    </div>
    <form class="flex flex-col sm:flex-row gap-2 pb-2" @submit="onDelete">
      <FormTextInput
        name="projectName"
        label="Project name"
        placeholder="Project name"
        :rules="[stringMatchesProjectName]"
        full-width
        validate-on-mount
        validate-on-value-update
        hide-error-message
        class="text-sm"
      />
      <FormButton
        submit
        :disabled="!!Object.values(deleteErrors).length"
        color="danger"
      >
        Delete
      </FormButton>
    </form>
  </LayoutDialogSection>
</template>
<script setup lang="ts">
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { LayoutDialogSection } from '@speckle/ui-components'
import { useForm } from 'vee-validate'
import type { GenericValidateFunction } from 'vee-validate'
import type { ProjectPageTeamDialogFragment } from '~~/lib/common/generated/gql/graphql'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useDeleteProject } from '~~/lib/projects/composables/projectManagement'
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

const { isOwner, isServerGuest } = useTeamDialogInternals({
  props: toRefs(props)
})
const deleteProject = useDeleteProject()
const mp = useMixpanel()

const onDelete = handleDeleteSubmit(async () => {
  if (!isOwner.value) return
  await deleteProject(props.project.id, { goHome: true })
  mp.track('Stream Action', { type: 'action', name: 'delete' })
})
</script>
