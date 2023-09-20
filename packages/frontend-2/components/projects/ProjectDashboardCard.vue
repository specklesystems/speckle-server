<template>
  <div>
    <div
      class="relative group flex flex-col md:flex-row md:space-x-2 border-2 border-primary-muted hover:bg-primary-muted rounded-md p-3 transition overflow-hidden"
    >
      <div
        class="w-full md:w-48 flex flex-col col-span-3 lg:col-span-1 mb-4 md:mb-0 flex-shrink-0 space-y-1"
      >
        <div class="text-2xl font-bold hover:text-primary transition">
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
        <!-- Note: commented out as we have the +x models indicator. Less clutter! -->
        <!-- <div class="text-xs text-foreground-2 flex items-center">
          <CubeIcon class="w-4 h-4 mr-1" />
          {{ project.models.totalCount }} models
        </div> -->
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
        class="absolute -right-11 hover:right-0 top-1/2 translate -translate-y-1/2 bg-foundation text-primary text-xs font-bold transition-all opacity-0 group-hover:opacity-100 rounded-l-md shadow-md px-1 py-4"
      >
        +{{ modelItemTotalCount - 4 }} model{{
          modelItemTotalCount - 4 !== 1 ? 's' : ''
        }}
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import dayjs from 'dayjs'
import { ProjectDashboardItemFragment } from '~~/lib/common/generated/gql/graphql'
import { UserCircleIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { projectRoute } from '~~/lib/common/helpers/route'
import { useGeneralProjectPageUpdateTracking } from '~~/lib/projects/composables/projectPages'

const props = defineProps<{
  project: ProjectDashboardItemFragment
}>()

const projectId = computed(() => props.project.id)

// Tracking updates to project, its models and versions
useGeneralProjectPageUpdateTracking(
  { projectId },
  { redirectHomeOnProjectDeletion: false }
)

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
