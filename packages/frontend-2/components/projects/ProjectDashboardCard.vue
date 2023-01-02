<template>
  <NuxtLink :to="`/projects/${project.id}`">
    <div
      class="group flex flex-col md:flex-row border-2 border-primary-muted hover:bg-primary-muted rounded-md p-3 transition"
    >
      <div class="w-full md:w-1/5 flex flex-col col-span-3 lg:col-span-1 mb-4 md:mb-0">
        <div class="text-2xl font-bold group-hover:text-primary transition">
          <NuxtLink :to="`/projects/${project.id}`">{{ project.name }}</NuxtLink>
          <UserAvatarGroup :users="project.team" :max-count="2" />
        </div>
        <div class="flex-grow"></div>
        <div class="text-xs text-foreground-2 flex items-center">
          <UserCircleIcon class="w-4 h-4 mr-1" />
          {{ project.role?.split(':').reverse()[0] }}
        </div>
        <div class="text-xs text-foreground-2 flex items-center">
          <ClockIcon class="w-4 h-4 mr-1" />
          updated
          <b>{{ updatedAt }}</b>
        </div>
      </div>
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 flex-grow col-span-4 lg:col-span-3"
      >
        <ProjectPageModelsCard
          v-for="model in slicedModels"
          :key="model.id"
          :model="model"
          :project-id="project.id"
          :show-versions="false"
          :show-actions="false"
          height="h-52"
        />
        <div
          v-if="fullModels.length === 0"
          class="h-36 flex items-center col-span-4 py-4"
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
import dayjs from 'dayjs'
import { ProjectDashboardItemFragment } from '~~/lib/common/generated/gql/graphql'
import { UserCircleIcon, ClockIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  project: ProjectDashboardItemFragment
}>()

const models = computed(() => {
  let arr = [...(props.project.models?.items || [])]
  arr.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  arr = arr.filter((m) => m.versionCount !== 0)
  arr = arr.slice(0, 3)
  return arr
})

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
