<template>
  <div
    class="group relative bg-foundation-2 rounded p-2 hover:text-primary hover:bg-primary-muted transition cursor-pointer hover:shadow-md"
  >
    <div class="font-bold text-ellipsis truncate">{{ project.name }}</div>
    <div class="caption text-foreground-2">{{ project.role?.split(':')[1] }}</div>
    <div class="caption text-foreground-2">
      {{ new Date(project.updatedAt).toLocaleString() }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { ProjectListProjectItemFragment } from '~/lib/common/generated/gql/graphql'
defineProps<{
  project: ProjectListProjectItemFragment
}>()
</script>
