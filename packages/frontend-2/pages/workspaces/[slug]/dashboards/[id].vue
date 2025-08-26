<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="dashboardsRoute('pilsgang2')"
        name="Dashboards"
        :separator="false"
      />
      <HeaderNavLink
        :to="dashboardRoute('pilsgang2', id as string)"
        :name="id as string"
      />
    </Portal>
    <div class="w-screen h-screen">
      <iframe
        :src="dashboardUrl"
        class="w-full h-full border-0"
        frameborder="0"
        title="Dashboard content"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { dashboardsRoute, dashboardRoute } from '~/lib/common/helpers/route'

definePageMeta({
  middleware: ['auth'],
  layout: 'dashboard'
})

const { id } = useRoute().params

const dashboardUrl = computed(() => {
  return `http://localhost:8083/dashboards/${id}?isEmbed=true`
})
</script>
