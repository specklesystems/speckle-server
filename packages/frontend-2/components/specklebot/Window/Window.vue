<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="absolute inset-0 h-dvh w-dvh flex items-center justify-center">
    <div
      class="absolute inset-0 z-10 backdrop-blur bg-foundation/10"
      @click="emit('close')"
    />
    <div class="relative z-20">
      <div
        class="max-w-2xl bg-foundation-3 w-full border border-outline-2 rounded-lg shadow-xl overflow-hidden"
      >
        <SpecklebotWindowInitial v-if="activeWindow === 'initial'" />
        <SpecklebotWindowChat v-if="activeWindow === 'chat'" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeWindow = ref<'initial' | 'chat'>('chat')
const specklebotInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  nextTick(() => {
    specklebotInput.value?.focus()
  })
})
</script>
