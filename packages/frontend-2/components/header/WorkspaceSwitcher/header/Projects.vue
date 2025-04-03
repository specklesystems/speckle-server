<template>
  <HeaderWorkspaceSwitcherHeader
    name="Personal projects"
    :to="projectsRoute"
  ></HeaderWorkspaceSwitcherHeader>
</template>

<script setup lang="ts">
import { projectsRoute } from '~/lib/common/helpers/route'
</script>
