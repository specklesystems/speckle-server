<template>
  <div
    class="group relative bg-foundation-2 rounded p-2 hover:text-primary hover:bg-primary-muted transition cursor-pointer hover:shadow-md"
  >
    <div class="font-bold text-ellipsis truncate">{{ project.name }}</div>
    <div class="caption text-foreground-2">{{ project.role?.split(':')[1] }}</div>
    <div class="caption text-foreground-2">updated {{ updatedAgo }}</div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import type { ProjectListProjectItemFragment } from '~/lib/common/generated/gql/graphql'
const props = defineProps<{
  project: ProjectListProjectItemFragment
}>()

const updatedAgo = computed(() => {
  return dayjs(props.project.updatedAt).from(dayjs())
})
</script>
