<template>
  <HeaderWorkspaceSwitcherHeader name="Projects" :to="projectsRoute">
    <p class="text-body-2xs text-foreground-2 truncate">2 projects to move</p>
  </HeaderWorkspaceSwitcherHeader>
</template>

<script setup lang="ts">
import { projectsRoute } from '~/lib/common/helpers/route'
</script>
