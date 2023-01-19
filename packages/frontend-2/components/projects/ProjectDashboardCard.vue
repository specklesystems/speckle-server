<template>
  <NuxtLink :to="projectRoute(project.id)">
    <div
      class="group flex flex-col md:flex-row md:space-x-2 border-2 border-primary-muted hover:bg-primary-muted rounded-md p-3 transition"
    >
      <div
        class="w-full md:w-48 flex flex-col col-span-3 lg:col-span-1 mb-4 md:mb-0 flex-shrink-0 space-y-1"
      >
        <div class="text-2xl font-bold group-hover:text-primary transition">
          <NuxtLink :to="projectRoute(project.id)">{{ project.name }}</NuxtLink>
          <UserAvatarGroup :users="project.team" :max-count="2" />
        </div>
        <div class="flex-grow"></div>
        <div class="text-xs text-foreground-2 flex items-center">
          <UserCircleIcon class="w-4 h-4 mr-1" />
          {{ project.role?.split(':').reverse()[0] }}
        </div>
        <div class="text-xs text-foreground-2 flex items-center">
          <CubeIcon class="w-4 h-4 mr-1" />
          {{ models.length }} models
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
          :project-id="project.id"
          :show-versions="false"
          :show-actions="false"
          height="h-52"
        />
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
    </div>
  </NuxtLink>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import {
  ProjectDashboardItemFragment,
  ProjectModelsUpdatedMessageType
} from '~~/lib/common/generated/gql/graphql'
import { UserCircleIcon, ClockIcon, CubeIcon } from '@heroicons/vue/24/outline'
import { projectRoute } from '~~/lib/common/helpers/route'
import { graphql } from '~~/lib/common/generated/gql'
import { useApolloClient, useSubscription } from '@vue/apollo-composable'
import {
  addFragmentDependencies,
  getCacheId,
  updateCacheByFilter
} from '~~/lib/common/helpers/graphql'
import {
  projectDashboardItemFragment,
  projectPageLatestItemsModelItemFragment
} from '~~/lib/projects/graphql/fragments'
import { sortBy } from 'lodash-es'

const fullProjectDashboardItemFragment = addFragmentDependencies(
  projectDashboardItemFragment,
  projectPageLatestItemsModelItemFragment
)

const onProjectModelUpdateSubscription = graphql(`
  subscription OnProjectModelUpdate($id: String!) {
    projectModelsUpdated(id: $id) {
      id
      type
      model {
        id
        ...ProjectPageLatestItemsModelItem
      }
    }
  }
`)

const props = defineProps<{
  project: ProjectDashboardItemFragment
}>()

const apollo = useApolloClient().client
const { onResult: onProjectModelUpdate } = useSubscription(
  onProjectModelUpdateSubscription,
  () => ({
    id: props.project.id
  })
)

const models = computed(() => props.project.models?.items || [])
const updatedAt = computed(() => dayjs(props.project.updatedAt).from(dayjs()))

onProjectModelUpdate((res) => {
  if (!res.data?.projectModelsUpdated) return

  const cache = apollo.cache
  const event = res.data.projectModelsUpdated
  const model = event.model

  if (
    [
      ProjectModelsUpdatedMessageType.Created,
      ProjectModelsUpdatedMessageType.Updated
    ].includes(event.type) &&
    model?.versionCount
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
  } else if (event.type === ProjectModelsUpdatedMessageType.Deleted) {
    // Delete
    cache.evict({
      id: getCacheId('Model', event.id)
    })
  }
})
</script>
