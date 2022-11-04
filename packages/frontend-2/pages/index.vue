<template>
  <div>
    <header class="default-width">
      <section
        xxxclass="p-10 rounded-xl siz background border-l-4 border-l-blue-500 shadow-lg dark:shadow-gray-400/20"
      >
        <h1 class="h3">Henlo 👋</h1>
        <p>
          Welcome {{ user?.name }}! This is a super big work in progress currently.
          <NuxtLink class="link" to="/designsystem">Design System Demo</NuxtLink>
        </p>
      </section>
    </header>
    <main class="default-width">
      <ModelDashboardList />
      <ProjectList />
    </main>
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

definePageMeta({
  title: 'Dashboard'
})
</script>
