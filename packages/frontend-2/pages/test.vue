<template>
  <div>Hello, {{ activeUserResult?.activeUser?.name || 'guest' }}!</div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

/**
 * TESTING SSR/HYDRATION ISSUES HERE, DON'T DELETE
 */

definePageMeta({
  layout: false
})

const activeUserQuery = graphql(`
  query GetActiveUser {
    activeUser {
      id
      name
      role
    }
  }
`)

// if (process.server) {
//   debugger
// }

const { result: activeUserResult } = useQuery(activeUserQuery)
// const user = computed(() => activeUserResult.value?.activeUser || null)

// watch(
//   activeUserResult,
//   (newUser, oldUser) => {
//     // if (process.server) return

//     console.log('WATCHER', newUser, oldUser)
//   },
//   { deep: true, immediate: true }
// )

// const renderName = () => {
//   console.log('renderName', user.value)
//   return `${user.value?.name || 'guest'}`
// }
</script>
