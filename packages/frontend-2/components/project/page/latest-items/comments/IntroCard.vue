<template>
  <div
    :class="[
      'p-4 w-full shadow rounded-lg bg-foundation',
      'flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:space-x-6 sm:items-center',
      'hover:shadow-md ring-outline-2 hover:ring-2'
    ]"
  >
    <img
      src="~~/assets/images/comments_intro_320x248.webp"
      alt="Comments functionality preview animation"
      class="w-[75%] sm:w-auto sm:h-[164px]"
      height="248"
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
