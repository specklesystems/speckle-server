<template>
  <div>
    <div v-if="project">
      <ProjectModelsPageHeader
        v-model:selected-apps="selectedApps"
        v-model:selected-members="selectedMembers"
        v-model:grid-or-list="gridOrList"
        v-model:search="search"
        :project="project"
        :disabled="loading"
        class="z-[1] relative"
      />
      <ProjectModelsPageResults
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
import { SourceAppDefinition } from '@speckle/shared'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'
import {
  FormUsersSelectItemFragment,
  ProjectModelsUpdatedMessageType,
  ProjectUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { useNavigateToHome } from '~~/lib/common/helpers/route'
import {
  useEvictProjectModelFields,
  useProjectModelUpdateTracking
} from '~~/lib/projects/composables/modelManagement'
import { useProjectUpdateTracking } from '~~/lib/projects/composables/projectManagement'
import {
  useProjectPendingVersionUpdateTracking,
  useProjectVersionUpdateTracking
} from '~~/lib/projects/composables/versionManagement'
import { projectModelsPageQuery } from '~~/lib/projects/graphql/queries'
import { useProjectPageItemViewType } from '~~/lib/projects/composables/layout'

definePageMeta({
  middleware: ['require-valid-project']
})

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const evictProjectModels = useEvictProjectModelFields()
const { triggerNotification } = useGlobalToast()
const goHome = useNavigateToHome()

const selectedMembers = ref([] as FormUsersSelectItemFragment[])
const selectedApps = ref([] as SourceAppDefinition[])
const gridOrList = useProjectPageItemViewType('Models')
const search = ref('')
const loading = ref(false)

const { result } = useQuery(projectModelsPageQuery, () => ({
  projectId: projectId.value
}))

const project = computed(() => result.value?.project)

// TODO: Maybe move these to a parent page that is the same for all projects subpages?
// Subscriptions for tracking updates to project, models, versions
useProjectVersionUpdateTracking(projectId)
useProjectPendingVersionUpdateTracking(projectId)
useProjectModelUpdateTracking(projectId, (event) => {
  // If creation, refresh all project's model fields
  if (event.type === ProjectModelsUpdatedMessageType.Created) {
    evictProjectModels(projectId.value)
  }
})
useProjectUpdateTracking(projectId, (event) => {
  const isDeleted = event.type === ProjectUpdatedMessageType.Deleted

  if (isDeleted) {
    goHome()
  }

  triggerNotification({
    type: ToastNotificationType.Info,
    title: isDeleted ? 'Project deleted' : 'Project updated',
    description: isDeleted ? 'Redirecting to home' : undefined
  })
})

const clearSearch = () => {
  search.value = ''
  selectedMembers.value = []
  selectedApps.value = []
}
</script>
