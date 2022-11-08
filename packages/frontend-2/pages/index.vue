<template>
  <div>
    <!-- <header class="default-width">
      <section>
        <h1 class="h3 text-foreground">Henlo 👋</h1>
        <p class="text-foreground">
          Welcome {{ user?.name }}! This is a super big work in progress currently.
          <NuxtLink class="link" to="/designsystem">Design System Demo</NuxtLink>
        </p>
      </section>
    </header> -->
    <main class="default-width">
      <NotificationsDashboardList />
      <ModelDashboardList :num-models="Math.floor(Math.random() * 5 + 1)" />
      <ProjectList :num-projects="Math.floor(Math.random() * 15 + 1)" />
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
