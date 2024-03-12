<template>
  <div class="flex flex-col items-center max-w-[180px] mx-auto">
    <div
      class="relative text-foreground-2 h-32 w-full"
      :class="small ? 'scale-75' : ''"
    >
      <div class="svg-downward absolute right-0 bottom-0">
        <slot name="bottom-svg"></slot>
      </div>
      <div class="svg-upward absolute left-0 bottom-0 z-10">
        <slot name="top-svg"></slot>
      </div>
    </div>
    <div class="flex flex-col gap-1 items-center text-center">
      <span class="text-foreground font-bold">{{ title }}</span>
      <span v-if="text" class="text-xs text-foreground-2">
        {{ text }}
      </span>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  small?: boolean
  title: string
  text?: string
}>()
</script>
<style scoped>
@keyframes move-up {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

@keyframes move-down {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(5px);
  }
}

.svg-upward {
  animation: move-up 4s linear infinite;
}

.svg-downward {
  animation: move-down 4s linear infinite;
}
</style>
