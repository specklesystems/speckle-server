<template>
  <a :href="`/project/${project.id}`" class="group">
    <div
      class="group background hover:background-highlight flex items-center justify-between px-4 mb-4 rounded-lg shadow h-16 hover:shadow-xl transition"
    >
      <div class="flex items-center gap-4">
        <div class="font-bold text-sm truncate">
          {{ project.name }}
        </div>
        <div
          class="hidden sm:flex items-center caption text-neutral-500 group-hover:text-gray-200"
        >
          <RectangleGroupIcon class="w-4 h-4 mr-2" />
          <span>{{ project.modelCount }} models</span>
        </div>
        <div class="hidden sm:flex caption text-neutral-500 group-hover:text-gray-200">
          {{ project.role }}
        </div>
        <div class="hidden sm:flex caption group-hover:text-gray-200">
          {{ project.editedAt }}
        </div>
      </div>
      <div class="flex items-center">
        <div class="flex -space-x-1">
          <img
            class="inline-block h-8 w-8 rounded-full ring-4 ring-white dark:ring-black"
            src="https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
          />
          <img
            v-if="project.team.length > 2"
            class="inline-block h-8 w-8 rounded-full ring-4 ring-white dark:ring-black"
            src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
          />
          <img
            v-if="project.team.length > 3"
            class="inline-block h-8 w-8 rounded-full ring-4 ring-white dark:ring-black"
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80"
            alt=""
          />
          <img
            v-if="project.team.length > 4"
            class="inline-block h-8 w-8 rounded-full ring-4 ring-white dark:ring-black"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt=""
          />
        </div>
        <div
          class="ml-2 transition-all -mr-6 group-hover:mr-0 scale-0 group-hover:scale-100"
        >
          <ChevronRightIcon class="w-4 h-4" />
        </div>
      </div>
    </div>
  </a>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { RectangleGroupIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'
import { ProjectListItemFragmentFragment } from '~~/lib/common/generated/gql/graphql'

import { useQuery } from '@vue/apollo-composable'

defineProps({
  project: {
    type: Object as PropType<ProjectListItemFragmentFragment>,
    required: true
  }
})
</script>
