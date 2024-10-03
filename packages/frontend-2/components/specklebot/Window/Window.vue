<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="absolute inset-0 h-dvh w-dvh flex items-center justify-center">
    <div
      class="absolute inset-0 z-10 backdrop-blur bg-foundation/10"
      @click="emit('close')"
    />
    <div class="relative z-20 w-full flex justify-center" @click="emit('close')">
      <div
        class="max-w-2xl bg-foundation-page w-full border border-outline-2 rounded-lg shadow-xl overflow-hidden"
        @click.stop
      >
        <SpecklebotWindowInitial
          v-if="activeWindow === 'initial'"
          @card-clicked="handleCardClick"
        />
        <SpecklebotWindowChat
          v-if="activeWindow === 'chat'"
          :initial-prompt="initialPrompt"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
}>()

const activeWindow = ref<'initial' | 'chat'>('initial')
const initialPrompt = ref('')

const handleCardClick = (cardTitle: string) => {
  activeWindow.value = 'chat'
  initialPrompt.value = `Let's talk about ${cardTitle}.`
}
</script>
