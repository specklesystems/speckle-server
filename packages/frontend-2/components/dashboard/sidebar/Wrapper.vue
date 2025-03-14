<template>
  <div class="h-full">
    <DashboardSidebarNew v-if="isWorkspaceNewPlansEnabled" />
    <DashboardSidebar v-else />
  </div>
</template>

<script setup lang="ts">
// Temporary wrapper to hold both the old and new sidebars
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
</script>
