<template>
  <tr class="h-[62px] bg-foundation">
    <td class="normal text-foreground font-semibold">
      <div class="inline-flex align-middle items-center space-x-1 pl-5 pr-8 w-[250px]">
        <UserAvatar size="20" no-border />
        <span class="truncate">Darlene Robertson son son son son</span>
      </div>
    </td>
    <td class="normal text-foreground truncate pr-5">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
      incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
      exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
      irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
      pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
      officia deserunt mollit anim id est laborum.
    </td>
    <td class="text-foreground-2 normal pr-5 text-center xl:text-left">
      12 seconds ago
    </td>
    <td class="text-foreground normal pr-5">
      <div class="inline-flex items-center space-x-1 align-middle">
        <ChatBubbleLeftEllipsisIcon class="h-5 w-5" />
        <span>120</span>
      </div>
    </td>
    <td class="pr-5">
      <div class="flex space-x-[1px] align-middle">
        <div
          ref="containerWrapper"
          class="flex space-x-[1px] flex-wrap overflow-hidden h-8"
        >
          <UserAvatar no-border />
          <UserAvatar no-border />
          <UserAvatar no-border />
          <UserAvatar no-border />
          <UserAvatar no-border />
        </div>
        <UserAvatarText v-if="hiddenItemCount" class="text-foreground normal">
          +{{ hiddenItemCount }}
        </UserAvatarText>
      </div>
    </td>
    <td
      class="bg-cover bg-no-repeat bg-center"
      :style="{ backgroundImage: `url('${previewUrl}')` }"
    />
  </tr>
</template>
<script setup lang="ts">
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/vue/24/solid'
import { useWrappingContainerHiddenCount } from '~~/lib/layout/composables/resize'

const { containerWrapper, hiddenItemCount } = useWrappingContainerHiddenCount()

const previewUrl = ref('https://i.imgur.com/DbCgdcq.jpg')
</script>
