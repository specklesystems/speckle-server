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
import { projectModelPageQuery } from '~~/lib/projects/graphql/queries'

/**
 * SPLIT THINGS UP INTO COMPONENT FRAGMENTS
 */

definePageMeta({
  middleware: ['require-valid-project', 'require-valid-model']
})

const route = useRoute()
const { result: pageData } = useQuery(projectModelPageQuery, () => ({
  projectId: route.params.id as string,
  modelId: route.params.modelId as string
}))

const project = computed(() => pageData.value?.project)
</script>
