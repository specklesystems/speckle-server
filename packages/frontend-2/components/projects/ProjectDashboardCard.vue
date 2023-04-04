<template>
  <NuxtLink :to="projectRoute(project.id)">
    <div
      class="relative group flex flex-col md:flex-row md:space-x-2 border-2 border-primary-muted hover:bg-primary-muted rounded-md p-3 transition overflow-hidden"
    >
      <div
        class="w-full md:w-48 flex flex-col col-span-3 lg:col-span-1 mb-4 md:mb-0 flex-shrink-0 space-y-1"
      >
        <div class="text-2xl font-bold group-hover:text-primary transition">
          <NuxtLink :to="projectRoute(project.id)" class="break-words">
            {{ project.name }}
          </NuxtLink>
          <UserAvatarGroup :users="teamUsers" :max-count="2" class="mt-2" />
        </div>
        <div class="flex-grow"></div>
        <div class="text-xs text-foreground-2 flex items-center">
          <UserCircleIcon class="w-4 h-4 mr-1" />
          {{ project.role?.split(':').reverse()[0] }}
        </div>
        <div class="text-xs text-foreground-2 flex items-center">
          <CubeIcon class="w-4 h-4 mr-1" />
          {{ project.models.totalCount }} models
        </div>
        <div class="text-xs text-foreground-2 flex items-center">
          <ClockIcon class="w-4 h-4 mr-1" />
          updated&nbsp;
          <b>{{ updatedAt }}</b>
        </div>
      </div>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-grow col-span-4 lg:col-span-3"
      >
        <ProjectPageModelsCard
          v-for="pendingModel in pendingModels"
          :key="pendingModel.id"
          :model="pendingModel"
          :project="project"
          height="h-52"
        />
        <ProjectPageModelsCard
          v-for="model in models"
          :key="model.id"
          :model="model"
          :project="project"
          :show-versions="false"
          :show-actions="false"
          height="h-52"
        />
        <ProjectCardImportFileArea
          v-if="hasNoModels"
          :project-id="project.id"
          class="h-36 col-span-4"
        />
      </div>
      <div
        v-if="modelItemTotalCount > 4"
        class="absolute -right-11 hover:right-0 top-1/2 translate -translate-y-1/2 bg-foundation text-primary text-xs font-semibold transition-all opacity-0 group-hover:opacity-100 rounded-l-md shadow-md px-1 py-2"
      >
        +{{ modelItemTotalCount - 4 }} model{{
          modelItemTotalCount - 4 !== 1 ? 's' : ''
        }}
      </div>
    </div>
  </NuxtLink>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  Project,
  ProjectDashboardItemFragment,
  ProjectModelsArgs,
  ProjectModelsUpdatedMessageType,
  ProjectPendingImportedModelsArgs,
  ProjectPendingModelsUpdatedMessageType,
  ProjectVersionsUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { UserCircleIcon, ClockIcon, CubeIcon } from '@heroicons/vue/24/outline'
import { projectRoute } from '~~/lib/common/helpers/route'
import {
  evictObjectFields,
  getCacheId,
  modifyObjectFields
} from '~~/lib/common/helpers/graphql'
import { has } from 'lodash-es'
import {
  useProjectModelUpdateTracking,
  useProjectPendingModelUpdateTracking
} from '~~/lib/projects/composables/modelManagement'
import { useProjectVersionUpdateTracking } from '~~/lib/projects/composables/versionManagement'
import { useProjectUpdateTracking } from '~~/lib/projects/composables/projectManagement'
import { FileUploadConvertedStatus } from '~~/lib/core/api/fileImport'
import { ToastNotificationType, useGlobalToast } from '~~/lib/common/composables/toast'

const props = defineProps<{
  project: ProjectDashboardItemFragment
}>()

const projectId = computed(() => props.project.id)

const { triggerNotification } = useGlobalToast()

useProjectUpdateTracking(projectId)

useProjectVersionUpdateTracking(
  projectId,
  (event, cache) => {
    // Re-calculate latest 4 models
    const version = event.version
    if (
      [
        ProjectVersionsUpdatedMessageType.Created,
        ProjectVersionsUpdatedMessageType.Updated
      ].includes(event.type) &&
      version
    ) {
      // Added new model w/ versions OR updated model that now has versions (it might now have had them previously)
      // So - add it to the list, if its not already there
      modifyObjectFields<ProjectModelsArgs, Project['models']>(
        cache,
        getCacheId('Project', props.project.id),
        (fieldName, variables, value, { ref }) => {
          if (fieldName !== 'models') return
          if (variables.filter?.search) return

          const newModelRef = ref('Model', version.model.id)
          const newItems = (value?.items || []).slice()

          let isAdded = false
          if (!newItems.find((i) => i.__ref === newModelRef.__ref)) {
            newItems.unshift(newModelRef)
            isAdded = true
          }

          return {
            ...(value || {}),
            items: newItems,
            totalCount: (value.totalCount || 0) + (isAdded ? 1 : 0)
          }
        }
      )

      if (event.type === ProjectVersionsUpdatedMessageType.Created) {
        // Remove from pending models?
        modifyObjectFields<
          ProjectPendingImportedModelsArgs,
          Project['pendingImportedModels']
        >(
          cache,
          getCacheId('Project', props.project.id),
          (fieldName, _variables, value, { readField }) => {
            if (fieldName !== 'pendingImportedModels') return
            if (!value?.length) return

            const versionModelName = version.model.name
            const currentModels = (value || []).filter((i) => {
              const itemModelName = readField('modelName', i)
              return itemModelName !== versionModelName
            })
            return currentModels
          }
        )
      }
    }
  },
  { silenceToast: true }
)

useProjectPendingModelUpdateTracking(projectId, (event, cache) => {
  if (event.type === ProjectPendingModelsUpdatedMessageType.Created) {
    // Insert into project.pendingModels
    modifyObjectFields<
      ProjectPendingImportedModelsArgs,
      Project['pendingImportedModels']
    >(
      cache,
      getCacheId('Project', props.project.id),
      (fieldName, _variables, value, { ref }) => {
        if (fieldName !== 'pendingImportedModels') return
        const currentModels = (value || []).slice()
        currentModels.push(ref('FileUpload', event.id))
        return currentModels
      }
    )

    // Evict modelsTree
    evictObjectFields(
      cache,
      getCacheId('Project', props.project.id),
      (fieldName) => fieldName === 'modelsTree'
    )
  } else if (event.type === ProjectPendingModelsUpdatedMessageType.Updated) {
    // If converted emit toast notification & remove from pending models
    // (if it still exists there, cause "version create" subscription might've already removed it)
    const success = event.model.convertedStatus === FileUploadConvertedStatus.Completed
    const failure = event.model.convertedStatus === FileUploadConvertedStatus.Error
    const newModel = event.model.model

    if (success && newModel) {
      triggerNotification({
        type: ToastNotificationType.Success,
        title: 'File successfully imported',
        description: `${event.model.modelName} has been successfully imported`
      })

      modifyObjectFields<
        ProjectPendingImportedModelsArgs,
        Project['pendingImportedModels']
      >(
        cache,
        getCacheId('Project', props.project.id),
        (fieldName, _variables, value, { ref }) => {
          if (fieldName !== 'pendingImportedModels') return
          if (!value?.length) return

          const currentModels = (value || []).filter(
            (i) => i.__ref !== ref('FileUpload', event.id).__ref
          )
          return currentModels
        }
      )
    } else if (failure) {
      triggerNotification({
        type: ToastNotificationType.Danger,
        title: 'File import failed',
        description:
          event.model.convertedMessage ||
          `${event.model.modelName} could not be imported`
      })
    }
  }
})

useProjectModelUpdateTracking(projectId, (event, cache) => {
  const model = event.model
  if (
    [
      ProjectModelsUpdatedMessageType.Created,
      ProjectModelsUpdatedMessageType.Updated
    ].includes(event.type) &&
    model?.versionCount.totalCount
  ) {
    // Added new model w/ versions OR updated model that now has versions (it might now have had them previously)
    // So - add it to the list, if its not already there
    modifyObjectFields<ProjectModelsArgs, Project['models']>(
      cache,
      getCacheId('Project', props.project.id),
      (fieldName, variables, value, { ref }) => {
        if (fieldName !== 'models') return
        if (variables.filter?.search) return

        const newModelRef = ref('Model', model.id)
        const newItems = (value?.items || []).slice()

        let isAdded = false
        if (!newItems.find((i) => i.__ref === newModelRef.__ref)) {
          newItems.unshift(newModelRef)
          isAdded = true
        }

        return {
          ...(value || {}),
          items: newItems,
          totalCount: (value.totalCount || 0) + (isAdded ? 1 : 0)
        }
      }
    )
  }

  // Evict other project page models queries so that we don't have a stale cache there
  evictObjectFields<ProjectModelsArgs>(
    cache,
    getCacheId('Project', props.project.id),
    (fieldName, variables) => {
      if (fieldName !== 'models') return false
      if (!has(variables?.filter, 'search')) return false
      return true
    }
  )
})

const teamUsers = computed(() => props.project.team.map((t) => t.user))
const pendingModels = computed(() => props.project.pendingImportedModels)
const models = computed(() => {
  const items = props.project.models?.items || []
  return items.slice(0, Math.max(0, 4 - pendingModels.value.length))
})
const updatedAt = computed(() => dayjs(props.project.updatedAt).from(dayjs()))

const hasNoModels = computed(() => !models.value.length && !pendingModels.value.length)
const modelItemTotalCount = computed(
  () => props.project.models.totalCount + pendingModels.value.length
)
</script>
