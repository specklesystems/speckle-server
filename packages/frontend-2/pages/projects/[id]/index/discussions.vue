<template>
  <ProjectPageDiscussionsTab />
</template>
<script setup lang="ts">
import type { ProjectPageProjectFragment } from '~~/lib/common/generated/gql/graphql'

const attrs = useAttrs() as {
  project: ProjectPageProjectFragment
}

const projectName = computed(() =>
  attrs.project.name.length ? attrs.project.name : ''
)

useHead({
  title: `Discussions | ${projectName.value}`
})
</script>
