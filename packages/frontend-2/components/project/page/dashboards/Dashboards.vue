<template>
  <div>
    <DashboardsList :project-id="projectId" />
  </div>
</template>

<script setup lang="ts">
import type { ProjectPageProjectFragment } from '~~/lib/common/generated/gql/graphql'

const attrs = useAttrs() as {
  project: ProjectPageProjectFragment
}

const projectId = computed(() => attrs.project.id)
</script>
