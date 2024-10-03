<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="absolute inset-0 h-dvh w-dvh flex pointer-events-none"
    :class="open ? 'items-center justify-center' : 'items-end justify-end pb-6 pr-6'"
  >
    <div
      v-if="open"
      class="absolute inset-0 z-40 backdrop-blur bg-foundation/10 pointer-events-auto"
      @click="closeWindow()"
    />
    <div
      class="relative z-50 w-full flex pointer-events-auto"
      :class="open ? 'justify-center' : 'justify-end items-end'"
      @click="closeWindow()"
    >
      <div
        class="relative bg-foundation-page w-full border border-outline-3 shadow-xl overflow-hidden"
        :class="
          open
            ? 'rounded-lg max-w-2xl'
            : 'rounded-full max-w-max hover:scale-110 hover:border-outline-5 transition-all'
        "
        @click.stop
      >
        <button
          v-if="open && activeWindow !== 'initial'"
          class="absolute flex gap-2 items-center top-4 left-4 text-body-xs text-foreground-2 hover:text-foreground"
          @click="activeWindow = 'initial'"
        >
          <ChevronLeftIcon class="h-4 w-4" />
          Back
        </button>
        <button v-if="open" class="absolute top-4 right-4" @click="closeWindow()">
          <XMarkIcon class="h-5 w-5 text-foreground-2 hover:text-foreground" />
        </button>
        <div
          v-if="!open"
          class="group cursor-pointer bg-foundation p-3"
          @click="open = true"
        >
          <img
            src="~/assets/images/specklebot.gif"
            alt="Specklebot"
            class="w-8 h-8 hidden group-hover:block"
          />
          <img
            src="~/assets/images/specklebot.png"
            alt="Specklebot"
            class="w-8 h-8 group-hover:hidden"
          />
        </div>
        <div v-if="open" :class="activeWindow !== 'initial' ? 'mt-8' : ''">
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
  </div>
</template>

<script setup lang="ts">
import { ModifierKeys, onKeyboardShortcut } from '@speckle/ui-components'
import { onKeyStroke } from '@vueuse/core'
import { XMarkIcon, ChevronLeftIcon } from '@heroicons/vue/20/solid'

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
