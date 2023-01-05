<template>
  <NuxtLink :to="projectRoute(project.id)">
    <div
      class="group border-2 border-primary-muted hover:bg-primary-muted rounded-xl p-4 transition"
    >
      <div class="w-full mb-4 flex flex-col md:flex-row py-2 items-center">
        <div class="w-full md:w-auto mb-4 md:mb-0">
          <div class="text-2xl font-bold group-hover:text-primary transition mb-2">
            {{ project.name }}
          </div>

          <UserAvatarGroup :users="project.team" :max-count="3" />
        </div>
        <div class="hidden md:block flex-grow"></div>
        <div class="w-full md:w-auto">
          <div
            class="text-right text-xs text-foreground-2 flex items-center justify-start md:justify-end"
          >
            updated&nbsp;
            <b>{{ updatedAt }}</b>
            <ClockIcon class="w-4 h-4 ml-1" />
          </div>
          <div
            class="text-right text-xs text-foreground-2 flex items-center justify-start md:justify-end"
          >
            {{ project.role?.split(':').reverse()[0] }}
            <UserCircleIcon class="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-grow col-span-4 lg:col-span-3"
      >
        <ProjectPageModelsCard
          v-for="model in slicedModels"
          :key="model.id"
          :model="model"
          :project-id="project.id"
          :show-versions="false"
          :show-actions="false"
        />

        <div
          v-if="fullModels.length === 0"
          class="h-24 flex items-center col-span-4 py-4"
        >
          <div
            class="w-full h-full border-dashed border-2 border-blue-500/30 rounded-md p-10 flex items-center justify-center"
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
/**
 * TODO: Delete if unused
 */

import dayjs from 'dayjs'
import { ProjectDashboardItemFragment } from '~~/lib/common/generated/gql/graphql'
import { UserCircleIcon, ClockIcon } from '@heroicons/vue/24/outline'
import { projectRoute } from '~~/lib/common/helpers/route'

const props = defineProps<{
  project: ProjectDashboardItemFragment
}>()

const sortedModels = computed(() => {
  const arr = [...(props.project.models?.items || [])]
  arr.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  return arr
})

const fullModels = computed(() => {
  return sortedModels.value.filter((m) => m.versionCount !== 0)
})

const slicedModels = computed(() => {
  return fullModels.value.slice(0, 4)
})

const updatedAt = computed(() => dayjs(props.project.updatedAt).from(dayjs()))
</script>
