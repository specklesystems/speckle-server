<template>
  <div>
    <Title>{{ project?.name }}</Title>
    <NuxtPage />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

const route = useRoute()
const projectQuery = graphql(
  `
    query ProjectLandingPage($id: String!) {
      project(id: $id) {
        id
        name
        modelCount
        role
        updatedAt
        team {
          id
          name
        }
      }
    }
  `
)

const { result } = useQuery(projectQuery, () => {
  return { id: route.params.projectId as string }
})

const project = computed(() => result.value?.project || null)
const nav = useNav()

onMounted(() => {
  nav.value[0] = reactive({
    to: `/project/${route.params.projectId as string}`,
    name: computed(() => result.value?.project.name || 'loading'),
    separator: true
  })
})

onUnmounted(() => {
  nav.value.splice(0, 1)
})
</script>
