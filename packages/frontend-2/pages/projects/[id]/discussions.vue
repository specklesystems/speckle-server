<template>
  <div>
    <div v-if="project">
      <ProjectDiscussionsPageHeader
        v-model:grid-or-list="gridOrList"
        v-model:include-archived="includeArchived"
        :project="project"
      />
      <ProjectDiscussionsPageResults
        :grid-or-list="gridOrList"
        :project="project"
        :include-archived="!!includeArchived"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { Optional } from '~~/../shared/dist-esm'
import {
  useGeneralProjectPageUpdateTracking,
  useProjectPageItemViewType
} from '~~/lib/projects/composables/projectPages'
import { projectDiscussionsPageQuery } from '~~/lib/projects/graphql/queries'

definePageMeta({
  middleware: ['require-valid-project']
})

const gridOrList = useProjectPageItemViewType('Discussions')
const includeArchived = ref(undefined as Optional<true>)

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const { result } = useQuery(projectDiscussionsPageQuery, () => ({
  projectId: projectId.value
}))
useGeneralProjectPageUpdateTracking({ projectId })

const project = computed(() => result.value?.project)
</script>
