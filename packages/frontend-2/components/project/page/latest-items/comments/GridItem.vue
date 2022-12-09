<template>
  <div class="h-36 rounded-lg bg-foundation shadow flex items-stretch">
    <!-- Main data -->
    <div class="flex flex-col justify-between py-2 px-6 min-w-0">
      <div class="flex flex-col">
        <div class="flex space-x-1 items-center mb-2">
          <UserAvatar size="24" no-border />
          <span
            class="normal font-semibold text-foreground whitespace-nowrap text-ellipsis overflow-hidden"
          >
            Darlene Robertson
          </span>
        </div>
        <div
          class="normal text-foreground whitespace-nowrap text-ellipsis overflow-hidden"
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
          incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
          nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
          eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
          in culpa qui officia deserunt mollit anim id est laborum.
        </div>
        <div class="caption text-foreground-2">12 min ago</div>
      </div>
      <div class="flex items-center space-x-2.5">
        <div class="text-foreground inline-flex items-center">
          <ChatBubbleLeftEllipsisIcon class="w-4 h-4 mr-1" />
          <span class="caption">12</span>
        </div>
        <LinkIcon class="w-4 h-4" />
        <div class="flex -space-x-1 relative">
          <UserAvatar size="24" style="z-index: 1" />
          <UserAvatar size="24" style="z-index: 2" />
          <UserAvatar size="24" style="z-index: 3" />
        </div>
      </div>
    </div>
    <!-- Image preview -->
    <div
      class="shrink-0 w-36 border-l border-outline-3 bg-no-repeat bg-center bg-cover"
      :style="{ backgroundImage: `url('${previewUrl}')` }"
    ></div>
  </div>
</template>
<script setup lang="ts">
import { ChatBubbleLeftEllipsisIcon, LinkIcon } from '@heroicons/vue/24/solid'

const previewUrl = ref('https://i.imgur.com/DbCgdcq.jpg')
</script>
