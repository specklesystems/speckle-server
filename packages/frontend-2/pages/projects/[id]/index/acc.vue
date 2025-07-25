<template>
  <ProjectPageAccTab :project-id="projectId" />
</template>
<script setup lang="ts">
import type { ProjectPageProjectFragment } from '~~/lib/common/generated/gql/graphql'
const route = useRoute()

const attrs = useAttrs() as {
  project: ProjectPageProjectFragment
}

const projectName = computed(() =>
  attrs.project.name.length ? attrs.project.name : ''
)

const projectId = computed(() => route.params.id as string)

useHead({
  title: `Acc | ${projectName.value}`
})
</script>
