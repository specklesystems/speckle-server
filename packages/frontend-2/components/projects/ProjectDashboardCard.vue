<template>
  <NuxtLink :to="projectRoute(project.id)">
    <div
      class="relative group flex flex-col md:flex-row md:space-x-2 border-2 border-primary-muted hover:bg-primary-muted rounded-md p-3 transition overflow-hidden"
    >
      <div
        class="w-full md:w-48 flex flex-col col-span-3 lg:col-span-1 mb-4 md:mb-0 flex-shrink-0 space-y-1"
      >
        <div class="text-2xl font-bold group-hover:text-primary transition">
          <NuxtLink :to="projectRoute(project.id)">{{ project.name }}</NuxtLink>
          <UserAvatarGroup :users="teamUsers" :max-count="2" />
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
          v-for="model in models"
          :key="model.id"
          :model="model"
          :project="project"
          :show-versions="false"
          :show-actions="false"
          height="h-52"
        />
        <!-- <div
          v-if="maxModels.length === 3"
          class="flex justify-center items-center text-lg text-blue-500/40 col-span-1"
        >
          and {{ project.models.totalCount - 3 }} more models
        </div> -->
        <div v-if="models.length === 0" class="h-36 flex items-center col-span-4 py-4">
          <div
            class="w-full h-full border-dashed border-2 border-outline-2 rounded-md p-10 flex items-center justify-center"
          >
            <span class="text-sm text-foreground-2">
              Use our
              <b>connectors</b>
              to send data to this model, or drag and drop a IFC/OBJ/STL file here.
            </span>
          </div>
        </div>
      </div>
      <div
        v-if="project.models.totalCount > 4"
        class="absolute -right-11 hover:right-0 top-1/2 translate -translate-y-1/2 bg-foundation text-primary text-xs font-semibold transition-all opacity-0 group-hover:opacity-100 rounded-l-md shadow-md px-1 py-2"
      >
        +{{ project.models.totalCount - 4 }} model{{
          project.models.totalCount - 4 !== 1 ? 's' : ''
        }}
      </div>
    </div>
  </NuxtLink>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  ProjectDashboardItemFragment,
  ProjectModelsUpdatedMessageType,
  ProjectVersionsUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { UserCircleIcon, ClockIcon, CubeIcon } from '@heroicons/vue/24/outline'
import { projectRoute } from '~~/lib/common/helpers/route'
import {
  addFragmentDependencies,
  evictObjectFields,
  getCacheId,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'
import {
  projectDashboardItemFragment,
  projectDashboardItemNoModelsFragment,
  projectPageLatestItemsModelItemFragment
} from '~~/lib/projects/graphql/fragments'
import { has, sortBy } from 'lodash-es'
import { useProjectModelUpdateTracking } from '~~/lib/projects/composables/modelManagement'
import { useProjectVersionUpdateTracking } from '~~/lib/projects/composables/versionManagement'
import { useProjectUpdateTracking } from '~~/lib/projects/composables/projectManagement'
import { Nullable } from '@speckle/shared'

const fullProjectDashboardItemFragment = addFragmentDependencies(
  projectDashboardItemFragment,
  projectPageLatestItemsModelItemFragment,
  projectDashboardItemNoModelsFragment
)

const props = defineProps<{
  project: ProjectDashboardItemFragment
}>()

const projectId = computed(() => props.project.id)

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
      updateCacheByFilter(
        cache,
        {
          fragment: {
            fragment: fullProjectDashboardItemFragment,
            fragmentName: 'ProjectDashboardItem',
            id: getCacheId('Project', props.project.id)
          }
        },
        (data) => {
          const newItems = data.models.items.slice()
          if (!newItems.find((i) => i.id === version.model.id)) {
            newItems.unshift(version.model)
          }

          const itemsSortedByDate = sortBy(newItems, (i) =>
            dayjs(i.updatedAt).toDate().getTime()
          ).reverse()

          return {
            ...data,
            models: {
              ...data.models,
              items: itemsSortedByDate.slice(0, 4)
            }
          }
        }
      )
    }
  },
  { silenceToast: true }
)

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
    updateCacheByFilter(
      cache,
      {
        fragment: {
          fragment: fullProjectDashboardItemFragment,
          fragmentName: 'ProjectDashboardItem',
          id: getCacheId('Project', props.project.id)
        }
      },
      (data) => {
        const newItems = data.models.items.slice()
        let newTotalCount = data.models.totalCount
        if (!newItems.find((i) => i.id === model.id)) {
          newItems.unshift(model)
        }

        if (event.type === ProjectModelsUpdatedMessageType.Created) {
          newTotalCount += 1
        }

        const itemsSortedByDate = sortBy(newItems, (i) =>
          dayjs(i.updatedAt).toDate().getTime()
        ).reverse()

        return {
          ...data,
          models: {
            ...data.models,
            totalCount: newTotalCount,
            items: itemsSortedByDate.slice(0, 4)
          }
        }
      }
    )
  }

  // Evict project page models queries so that we don't have a stale cache there
  evictObjectFields<{ filter?: { search?: Nullable<string> } }>(
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
const models = computed(() => props.project.models?.items || [])
// const maxModels = computed(() => {
//   if (props.project.models.totalCount >= 5) return models.value.slice(0, 3)
//   else return models.value
// })

const updatedAt = computed(() => dayjs(props.project.updatedAt).from(dayjs()))
</script>
