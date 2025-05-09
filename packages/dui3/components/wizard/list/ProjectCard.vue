<template>
  <div
    v-tippy="cardTippy"
    :class="`group relative bg-foundation-2 rounded px-2 py-1  transition ${
      hasAccess
        ? 'cursor-pointer hover:text-primary hover:bg-primary-muted hover:shadow-md'
        : 'cursor-not-allowed italic bg-neutral-500/5'
    } `"
  >
    <div
      :class="`text-heading-sm text-ellipsis truncate ${
        hasAccess ? '' : 'text-foreground-2'
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

const cardTippy = computed(() => (!hasAccess.value ? disabledMessage.value : ''))

const disabledMessage = computed(() =>
  props.isSender
    ? "Your role on this project doesn't give you permission to publish."
    : "Your role on this project doesn't give you permission to load."
)

const hasAccess = computed(
  () =>
    props.workspaceAdmin ||
    (props.project.role !== null && props.project.role !== 'stream:reviewer')
)

const projectRole = computed(() => {
  if (hasAccess.value) {
    return 'Can edit'
  }
  return 'Can view'
})
</script>
