<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="absolute inset-0 h-dvh w-dvh flex pointer-events-none"
    :class="open ? 'items-center justify-center' : 'items-end justify-end pb-6 pr-6'"
  >
    <div
      v-if="open"
      class="absolute inset-0 z-10 backdrop-blur bg-foundation/10 pointer-events-auto"
      @click="closeWindow()"
    />
    <div
      class="relative z-20 w-full flex pointer-events-auto"
      :class="open ? 'justify-center' : 'justify-end items-end'"
      @click="closeWindow()"
    >
      <div
        class="bg-foundation-page w-full border border-outline-2 shadow-xl overflow-hidden"
        :class="
          open
            ? 'rounded-lg max-w-2xl'
            : 'rounded-full max-w-max p-3  hover:scale-105 transition-all'
        "
        @click.stop
      >
        <div
          v-if="!open"
          class="group cursor-pointer bg-foundation"
          @click="open = true"
        >
          <img
            src="~/assets/images/specklebot.gif"
            alt="Specklebot"
            class="w-10 h-10 hidden group-hover:block"
          />
          <img
            src="~/assets/images/specklebot.png"
            alt="Specklebot"
            class="w-10 h-10 group-hover:hidden"
          />
        </div>
        <SpecklebotWindowInitial
          v-if="open && activeWindow === 'initial'"
          @card-clicked="handleCardClick"
        />
        <SpecklebotWindowChat
          v-if="open && activeWindow === 'chat'"
          :initial-prompt="initialPrompt"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ModifierKeys, onKeyboardShortcut } from '@speckle/ui-components'
import { onKeyStroke } from '@vueuse/core'

const open = ref(false)

const activeWindow = ref<'initial' | 'chat'>('initial')
const initialPrompt = ref('')

const handleCardClick = (cardTitle: string) => {
  activeWindow.value = 'chat'
  initialPrompt.value = `Let's talk about ${cardTitle}.`
}

const openWindow = () => {
  open.value = true
}

const closeWindow = () => {
  open.value = false
}

const toggleInput = () => {
  if (open.value) {
    closeWindow()
  } else {
    openWindow()
  }
}

const handleShortcut = () => {
  toggleInput()
}

onKeyboardShortcut([ModifierKeys.CtrlOrCmd], 'k', handleShortcut)
onKeyboardShortcut([ModifierKeys.AltOrOpt], 'k', handleShortcut)

onKeyStroke('Escape', () => {
  closeWindow()
})
</script>
