<template>
  <tr class="h-[62px] bg-foundation">
    <td
      class="bg-contain bg-no-repeat bg-center"
      :style="{ backgroundImage: `url('${previewUrl}')` }"
    />
    <td class="normal font-semibold">Model title</td>
    <td class="text-foreground-2 normal">
      <div class="inline-flex items-center space-x-1 align-middle">
        <ArrowPathRoundedSquareIcon class="h-5 w-5" />
        <span>4</span>
      </div>
    </td>
    <td class="text-foreground normal">
      <div class="inline-flex items-center space-x-1 align-middle">
        <ChatBubbleLeftEllipsisIcon class="h-5 w-5" />
        <span>12</span>
      </div>
    </td>
    <td>13 months ago</td>
    <td>12 months ago</td>
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
