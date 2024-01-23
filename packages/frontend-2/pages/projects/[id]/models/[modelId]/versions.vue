<template>
  <div>
    <div v-if="project">
      <ProjectModelPageHeader :project="project" />
      <ProjectModelPageVersions :project="project" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'
import { projectModelPageQuery } from '~~/lib/projects/graphql/queries'

definePageMeta({
  middleware: ['require-valid-project', 'require-valid-model']
})

const route = useRoute()

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

useHead({ title })
</script>
