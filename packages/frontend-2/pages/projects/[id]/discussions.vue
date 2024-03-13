<template>
  <div>
    <div>
      <Portal to="navigation">
        <HeaderNavLink
          :to="projectRoute(project.id)"
          :name="project.name"
        ></HeaderNavLink>
      </Portal>
    </div>

    <div v-if="project">
      <ProjectPageDiscussionsHeader
        v-model:grid-or-list="gridOrList"
        v-model:include-archived="includeArchived"
        :project="project"
      />
      <ProjectPageDiscussionsResults
        :grid-or-list="gridOrList"
        :project="project"
        :include-archived="!!includeArchived"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import type { Optional } from '~~/../shared/dist-esm'
import { projectRoute } from '~~/lib/common/helpers/route'
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
const title = computed(() =>
  project.value?.name.length ? `Discussions - ${project.value.name}` : ''
)

useHead({
  title
})
</script>
