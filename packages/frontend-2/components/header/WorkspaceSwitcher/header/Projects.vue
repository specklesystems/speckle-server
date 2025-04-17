<template>
  <HeaderWorkspaceSwitcherHeader name="Projects" :to="projectsRoute">
    <p class="text-body-2xs text-foreground-2 truncate">
      {{ text }}
    </p>
  </HeaderWorkspaceSwitcherHeader>
</template>

<script setup lang="ts">
import { projectsRoute } from '~/lib/common/helpers/route'
import { useActiveUserProjectsToMove } from '~~/lib/auth/composables/activeUser'

const { projectsToMoveCount } = useActiveUserProjectsToMove()

const text = computed(() => {
  if (!projectsToMoveCount.value) return 'No projects to move'
  return `${projectsToMoveCount.value} project${
    projectsToMoveCount.value === 1 ? '' : 's'
  } to move`
})
</script>
