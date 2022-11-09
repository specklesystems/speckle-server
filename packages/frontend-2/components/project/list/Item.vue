<template>
  <a :href="`/project/${project.id}`" class="group">
    <div
      class="group bg-base hover:bg-base-2 flex items-center justify-between px-4 mb-4 rounded-lg shadow h-16 hover:shadow-xl transition"
    >
      <div class="flex items-center gap-4">
        <div class="font-bold text-foreground truncate">
          {{ project.name }}
        </div>
        <div class="hidden text-foreground-2 sm:flex items-center caption">
          <RectangleGroupIcon class="w-4 h-4 mr-2" />
          <span>{{ project.modelCount }} models</span>
        </div>
        <div class="hidden text-foreground-2 sm:flex caption">
          {{ project.role }}
        </div>
        <div class="hidden text-foreground-2 sm:flex caption">
          {{ project.editedAt }}
        </div>
      </div>
      <div class="flex items-center">
        <AvatarGroup :num-avatars="project.team.length" />
        <div
          class="ml-2 transition-all -mr-6 group-hover:mr-0 scale-0 group-hover:scale-100"
        >
          <ChevronRightIcon class="text-foreground w-6 h-6" />
        </div>
      </div>
    </div>
  </a>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { RectangleGroupIcon, ChevronRightIcon } from '@heroicons/vue/24/solid'
import { ProjectListItemFragmentFragment } from '~~/lib/common/generated/gql/graphql'
import { graphql } from '~~/lib/common/generated/gql'

// no need to store it in a const or export it, cause you can refer to it without
// importing it in queries
graphql(`
  fragment ProjectListItemFragment on Project {
    id
    name
    modelCount
    role
    editedAt
    team {
      id
      name
      avatar
    }
  }
`)

defineProps({
  project: {
    type: Object as PropType<ProjectListItemFragmentFragment>,
    required: true
  }
})
</script>
