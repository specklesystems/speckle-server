<template>
  <div class="relative mt-16 rounded-md border border-outline-3 p-3 text-sm mx-1">
    <button class="absolute top-4 right-3">
      <XMarkIcon class="h-3 w-3 text-foreground stroke-[3]" />
    </button>
    <h6 class="font-semibold pr-8 text-foreground">Introducing Workspaces</h6>
    <p class="text-foreground-2 my-1">
      We’re thrilled to announce bla bla bla bli bla blu bla bla.
    </p>
    <CommonTextLink :to="homeRoute" size="sm">Learn more</CommonTextLink>
  </div>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'
</script>
