<template>
  <div class="text-2xl mt-14">
    This is a model viewer page for model: {{ route.params.modelId }}
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import { projectPageQuery } from '~~/lib/projects/graphql/queries'

// graphql(`
//   fragment ProjectPageProject on Project {
//     id
//     createdAt
//     ...ProjectPageProjectHeader
//     ...ProjectPageStatsBlockTeam
//     ...ProjectPageStatsBlockVersions
//     ...ProjectPageStatsBlockModels
//     ...ProjectPageStatsBlockComments
//     ...ProjectPageLatestItemsModels
//     ...ProjectPageLatestItemsComments
//   }
// `)

// definePageMeta({
//   middleware: ['require-valid-project']
// })

const route = useRoute()
definePageMeta({ layout: 'viewer' })
// const { result: projectPageResult } = useQuery(projectPageQuery, () => ({
//   id: route.params.id as string
// }))

// const project = computed(() => projectPageResult.value?.project)
</script>
