<template>
  <div
    v-tippy="disabled ? 'You do not have write access to this project.' : ''"
    :class="`group relative bg-foundation-2 rounded px-2 py-1  transition ${
      disabled
        ? 'cursor-not-allowed italic bg-neutral-500/5'
        : 'cursor-pointer hover:text-primary hover:bg-primary-muted hover:shadow-md'
    } `"
  >
    <div
      :class="`text-heading-sm text-ellipsis truncate ${
        disabled ? 'text-foreground-2' : ''
      }`"
    >
      {{ project.name }}
    </div>
    <div class="text-body-3xs text-foreground-2">
      {{ project.role?.split(':')[1] }}, updated {{ updatedAgo }}
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import type { ProjectListProjectItemFragment } from '~/lib/common/generated/gql/graphql'
const props = withDefaults(
  defineProps<{
    project: ProjectListProjectItemFragment
    disableNoWriteAccessProjects?: boolean
  }>(),
  { disableNoWriteAccessProjects: false }
)

const updatedAgo = computed(() => {
  return dayjs(props.project.updatedAt).from(dayjs())
})

const disabled = computed(() => {
  return (
    props.disableNoWriteAccessProjects &&
    (!props.project.role || props.project.role === 'stream:reviewer')
  )
})
</script>
