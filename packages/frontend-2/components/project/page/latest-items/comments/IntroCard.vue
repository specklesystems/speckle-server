<template>
  <div
    class="flex p-4 w-full shadow rounded-lg bg-foundation space-x-6 items-center hover:shadow-md ring-outline-2 hover:ring-2"
  >
    <img
      src="~~/assets/images/comments_intro_320x248.webp"
      alt="Comments functionality preview animation"
      style="height: 164px"
      decoding="async"
    />
    <div class="flex flex-col space-y-1 grow items-start">
      <div class="caption text-foreground-2">No comments to show</div>
      <FormButton text>
        <span class="inline-flex items-center space-x-1 text-left">
          <span>Read this tutorial and be the first person to comment</span>
          <ChevronRightIcon class="w-6 h-6 text-foreground" />
        </span>
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronRightIcon } from '@heroicons/vue/24/solid'
</script>
