<template>
  <a :href="`/project/${project.id}`" class="group">
    <div
      class="group bg-background hover:bg-background-accent flex items-center justify-between px-4 mb-4 rounded-lg shadow h-16 hover:shadow-xl transition"
    >
      <div class="flex items-center gap-4">
        <div class="font-bold text-foreground truncate">
          {{ project.name }}
        </div>
        <div class="hidden text-foreground-dim sm:flex items-center caption">
          <RectangleGroupIcon class="w-4 h-4 mr-2" />
          <span>{{ project.modelCount }} models</span>
        </div>
        <div class="hidden text-foreground-dim sm:flex caption">
          {{ project.role }}
        </div>
        <div class="hidden text-foreground-dim sm:flex caption">
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

import { useQuery } from '@vue/apollo-composable'

defineProps({
  project: {
    type: Object as PropType<ProjectListItemFragmentFragment>,
    required: true
  }
})
</script>
