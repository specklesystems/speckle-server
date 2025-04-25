<template>
  <div
    v-tippy="cardTippy"
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
      {{ projectRole }}, updated {{ updatedAgo }}
    </div>
  </div>
</template>
<script setup lang="ts">
import dayjs from 'dayjs'
import type { ProjectListProjectItemFragment } from '~/lib/common/generated/gql/graphql'
const props = withDefaults(
  defineProps<{
    project: ProjectListProjectItemFragment
    isSender: boolean
    disableNoWriteAccessProjects?: boolean
    workspaceAdmin?: boolean
  }>(),
  { disableNoWriteAccessProjects: false, workspaceAdmin: false }
)

const updatedAgo = computed(() => {
  return dayjs(props.project.updatedAt).from(dayjs())
})

const cardTippy = computed(() => (disabled.value ? disabledMessage.value : ''))

const disabledMessage = computed(() =>
  props.isSender
    ? "Your role on this project doesn't give you permission to publish."
    : "Your role on this project doesn't give you permission to load."
)

const disabled = computed(() => {
  return (
    !props.workspaceAdmin &&
    (!props.project.role || props.project.role === 'stream:reviewer')
  )
})

const projectRole = computed(() => {
  if (props.workspaceAdmin) {
    return 'Can edit'
  } else if (!props.project.role || props.project.role === 'stream:reviewer') {
    return 'Can view'
  }
  return 'Can edit'
})
</script>
