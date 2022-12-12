<template>
  <tr class="h-[62px] bg-foundation">
    <td
      class="bg-contain bg-no-repeat bg-center"
      :style="{ backgroundImage: `url('${previewUrl}')` }"
    />
    <td><!-- Fake padding (see thead) --></td>
    <td class="normal font-semibold truncate pr-5">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
      exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
      irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
      pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
      officia deserunt mollit anim id est laborum.
    </td>
    <td class="text-foreground-2 normal">
      <div class="inline-flex items-center space-x-1 align-middle">
        <ArrowPathRoundedSquareIcon class="h-5 w-5" />
        <span>999</span>
      </div>
    </td>
    <td class="text-foreground normal pr-5">
      <div class="inline-flex items-center space-x-1 align-middle">
        <ChatBubbleLeftEllipsisIcon class="h-5 w-5" />
        <span>999</span>
      </div>
    </td>
    <td class="pr-5">13 seconds ago</td>
    <td>12 seconds ago</td>
  </tr>
</template>
<script setup lang="ts">
import {
  ArrowPathRoundedSquareIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/vue/24/solid'

const previewUrl = ref(
  'https://latest.speckle.dev/preview/7d051a6449/commits/270741bd70'
)
</script>
