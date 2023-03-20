<template>
  <div class="">
    <div>
      <p class="px-2">
        Hello, {{ user?.name || 'guest' }}! Here are some design system examples.
      </p>
    </div>
    <DesignSystem />
  </div>
</template>
<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import { useQuery } from '@vue/apollo-composable'

const activeUserQuery = graphql(`
  query GetActiveUser {
    activeUser {
      id
      name
      role
    }
  }
`)

const { result: activeUserResult } = useQuery(activeUserQuery)
const user = computed(() => activeUserResult.value?.activeUser || null)
</script>
