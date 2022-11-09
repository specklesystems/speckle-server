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
    <NotificationsDashboardList />
    <ModelDashboardList :num-models="Math.floor(Math.random() * 5 + 1)" />
    <ProjectList :num-projects="Math.floor(Math.random() * 15 + 1)" />
  </div>
</template>
<script setup lang="ts">
import { Form } from 'vee-validate'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'

const { activeUser } = useActiveUser()
const user = computed(() => activeUser.value || null)

definePageMeta({
  title: 'Dashboard'
})
</script>
