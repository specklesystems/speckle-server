<template>
  <div class="flex gap-3">
    <div v-if="!isUser">
      <img
        v-if="loading"
        src="~/assets/images/specklebot.gif"
        alt="Specklebot"
        class="w-8 h-8 hidden"
      />
      <img
        v-else
        src="~/assets/images/specklebot.png"
        alt="Specklebot"
        class="w-8 h-8"
      />
    </div>
    <div
      class="max-w-max w-7/12 text-body-xs rounded-md px-4 py-2"
      :class="isUser ? 'ml-auto bg-primary text-foundation' : 'bg-highlight-3'"
    >
      <div v-if="loading">
        <div class="flex gap-0.5 justify-center items-center">
          <span class="sr-only">Loading...</span>
          <div
            class="h-1 w-1 bg-foreground-2 rounded-full animate-bounce [animation-delay:-0.3s]"
          ></div>
          <div
            class="h-1 w-1 bg-foreground-2 rounded-full animate-bounce [animation-delay:-0.15s]"
          ></div>
          <div class="h-1 w-1 bg-foreground-2 rounded-full animate-bounce"></div>
        </div>
      </div>
      <slot v-else />
    </div>
    <div v-if="isUser">
      <UserAvatar :user="activeUser" class="-ml-1" />
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  isUser: boolean
  loading?: boolean
}>()

const { activeUser } = useActiveUser()
</script>
