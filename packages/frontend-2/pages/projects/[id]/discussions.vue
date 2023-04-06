<template>
  <div>
    <div v-if="project">
      <ProjectDiscussionsPageHeader
        v-model:grid-or-list="gridOrList"
        :project="project"
      />
      <ProjectDiscussionsPageResults :grid-or-list="gridOrList" :project="project" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import {
  useGeneralProjectPageUpdateTracking,
  useProjectPageItemViewType
} from '~~/lib/projects/composables/projectPages'
import { projectDiscussionsPageQuery } from '~~/lib/projects/graphql/queries'

definePageMeta({
  middleware: ['require-valid-project']
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { result } = useQuery(projectDiscussionsPageQuery, () => ({
  projectId: projectId.value
}))
const gridOrList = useProjectPageItemViewType('Discussions')
useGeneralProjectPageUpdateTracking({ projectId })

const project = computed(() => result.value?.project)
</script>
