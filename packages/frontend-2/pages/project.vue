<template>
  <div>
    <Title>{{ project?.name }}</Title>
    <!-- <header class="default-width">
      <h1 class="h4 font-bold flex items-center">Project Parent Route</h1>
    </header> -->

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
        editedAt
        team {
          id
          name
        }
      }
    }
  `
)

const { result, loading } = useQuery(projectQuery, () => {
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
  //   nav.value.splice(
  //     0,
  //     0,
  //     reactive({
  //       to: route.path,
  //       name: computed(() => result.value?.project.name || 'loading'),
  //       separator: true
  //     })
  //   )
})

onUnmounted(() => {
  nav.value.splice(0, 1)
})
</script>
