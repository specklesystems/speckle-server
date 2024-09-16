<template>
  <div :class="classes">
    <!-- Decrementing z-index necessary for the actions menu to render correctly. Each card has its own stacking context because of the scale property -->
    <ProjectPageModelsCard
      v-for="(item, i) in items"
      :key="item.id"
      :model="item"
      :project-id="projectId"
      :project="project"
      :show-actions="showActions"
      :show-versions="showVersions"
      height="h-32 sm:h-64"
      :disable-default-link="disableDefaultLinks"
      :style="`z-index: ${items.length - i};`"
      @click="($event) => $emit('model-clicked', { id: item.id, e: $event })"
    />
  </div>
</template>
<script setup lang="ts">
import type { Optional } from '@speckle/shared'
import type {
  PendingFileUploadFragment,
  ProjectPageLatestItemsModelItemFragment,
  ProjectPageModelsCardProjectFragment
} from '~/lib/common/generated/gql/graphql'

defineEmits<{
  (e: 'model-clicked', v: { id: string; e: MouseEvent | KeyboardEvent }): void
}>()

const props = withDefaults(
  defineProps<{
    project: Optional<ProjectPageModelsCardProjectFragment>
    items: Array<ProjectPageLatestItemsModelItemFragment | PendingFileUploadFragment>
    projectId: string
    smallView?: boolean
    vertical?: boolean
    showActions?: boolean
    showVersions?: boolean
    disableDefaultLinks?: boolean
  }>(),
  {
    showActions: true,
    showVersions: true
  }
)

const classes = computed(() => {
  const classParts = ['relative z-10 grid gap-3']

  if (props.vertical) {
    classParts.push('grid-cols-1')
  } else if (props.smallView) {
    classParts.push('grid-cols-1 sm:grid-cols-2')
  } else {
    classParts.push('grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4')
  }

  return classParts.join(' ')
})
</script>
