<template>
  <div class="h-full">
    <SidebarNew v-if="isWorkspaceNewPlansEnabled" />
    <Sidebar v-else />
  </div>
</template>

<script setup lang="ts">
// Temporary wrapper to hold both the old and new sidebars
const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
</script>
