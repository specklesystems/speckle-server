<template>
  <div>
    <div v-if="project">
      <ProjectModelPageHeader :project="project" />
      <ProjectPageEditableTitleDescription
        :initial-title="project.model.name"
        :initial-description="project.model.description || undefined"
        :can-edit="canEdit"
        :is-disabled="anyMutationsLoading"
        @new-title="handleNewTitle"
        @new-description="handleNewDescription"
      />
      <ProjectModelPageVersions :project="project" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery, useMutationLoading } from '@vue/apollo-composable'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { projectModelPageQuery } from '~~/lib/projects/graphql/queries'
import { canEditProject } from '~~/lib/projects/helpers/permissions'
import { useUpdateModel } from '~~/lib/projects/composables/modelManagement'

definePageMeta({
  middleware: ['require-valid-project', 'require-valid-model']
})

const route = useRoute()
const updateModel = useUpdateModel()
const anyMutationsLoading = useMutationLoading()

const canEdit = computed(() => {
  if (project.value && project.value.role) {
    return canEditProject({ role: project.value.role })
  }
  return false
})

const projectId = computed(() => route.params.id as string)
const modelId = computed(() => route.params.modelId as string)

useGeneralProjectPageUpdateTracking(
  { projectId },
  {
    redirectToProjectOnModelDeletion: (deletedId) => deletedId === modelId.value
  }
)
const { result: pageData } = useQuery(projectModelPageQuery, () => ({
  projectId: projectId.value,
  modelId: modelId.value
}))

const project = computed(() => pageData.value?.project)

const title = computed(() =>
  project.value?.model.name.length ? `Versions - ${project.value.model.name}` : ''
)

const handleUpdateModel = async (newTitle?: string, newDescription?: string) => {
  if (!project.value || !project.value.model) return

  await updateModel({
    id: project.value.model.id,
    name: newTitle || project.value.model.name,
    description: newDescription || project.value.model.description,
    projectId: projectId.value
  })
  // Handle the response and update the local state or UI
}

const handleNewTitle = (newTitle: string) => {
  handleUpdateModel(newTitle)
}

const handleNewDescription = (newDescription: string) => {
  handleUpdateModel(undefined, newDescription)
}

useHead({ title })
</script>
