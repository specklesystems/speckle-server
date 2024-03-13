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
      <ProjectPageModelsHeader
        v-model:selected-apps="selectedApps"
        v-model:selected-members="selectedMembers"
        v-model:grid-or-list="gridOrList"
        v-model:search="search"
        :project="project"
        :disabled="loading"
        class="z-[1] relative"
      />
      <ProjectPageModelsResults
        v-model:grid-or-list="gridOrList"
        v-model:search="search"
        v-model:loading="loading"
        :source-apps="selectedApps"
        :contributors="selectedMembers"
        :project="project"
        class="z-[0] relative"
        @clear-search="clearSearch"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { projectRoute } from '~~/lib/common/helpers/route'
import type { SourceAppDefinition } from '@speckle/shared'
import type { FormUsersSelectItemFragment } from '~~/lib/common/generated/gql/graphql'
import { projectModelsPageQuery } from '~~/lib/projects/graphql/queries'
import {
  useGeneralProjectPageUpdateTracking,
  useProjectPageItemViewType
} from '~~/lib/projects/composables/projectPages'

definePageMeta({
  middleware: ['require-valid-project']
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)

const selectedMembers = ref([] as FormUsersSelectItemFragment[])
const selectedApps = ref([] as SourceAppDefinition[])
const gridOrList = useProjectPageItemViewType('Models')
const search = ref('')
const loading = ref(false)

const { result } = useQuery(projectModelsPageQuery, () => ({
  projectId: projectId.value
}))

const project = computed(() => result.value?.project)
useGeneralProjectPageUpdateTracking({ projectId })

const clearSearch = () => {
  search.value = ''
  selectedMembers.value = []
  selectedApps.value = []
}

const title = computed(() =>
  project.value?.name.length ? `Models - ${project.value.name}` : ''
)

useHead({
  title
})
</script>
