<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="absolute inset-0 h-dvh w-dvh flex pointer-events-none"
    :class="
      open
        ? activeWindow === 'visual'
          ? 'items-end justify-end'
          : 'items-center justify-center'
        : 'items-end justify-end pb-6 pr-6'
    "
  >
    <div
      v-if="open && activeWindow !== 'visual'"
      class="absolute inset-0 z-40 backdrop-blur bg-foundation/10 pointer-events-auto"
      @click="closeWindow()"
    />
    <div
      class="relative z-50 w-full flex pointer-events-auto"
      :class="
        open
          ? activeWindow === 'visual'
            ? 'justify-end items-end'
            : 'justify-center'
          : 'justify-end items-end'
      "
      @click="closeWindow()"
    >
      <div
        class="relative bg-foundation-page w-full border border-outline-3 shadow-xl overflow-hidden mt-12"
        :class="
          open
            ? activeWindow === 'visual'
              ? 'rounded-t-lg max-w-full h-full'
              : 'rounded-lg max-w-2xl'
            : 'rounded-full max-w-max hover:scale-110 hover:border-outline-5 transition-all'
        "
        @click.stop
      >
        <div
          v-if="open"
          class="flex items-center justify-between p-2 bg-foundation-page"
        >
          <button
            v-if="activeWindow !== 'initial'"
            class="flex gap-2 items-center text-body-xs text-foreground-2 hover:text-foreground"
            @click="activeWindow = 'initial'"
          >
            <ChevronLeftIcon class="h-4 w-4" />
            Back
          </button>
          <div v-else />
          <button @click="closeWindow()">
            <XMarkIcon class="h-5 w-5 text-foreground-2 hover:text-foreground" />
          </button>
        </div>

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
        <div v-if="open">
          <SpecklebotWindowInitial
            v-if="activeWindow === 'initial'"
            @chat-clicked="activeWindow = 'chat'"
            @compliance-clicked="activeWindow = 'compliance'"
            @version-clicked="activeWindow = 'version'"
            @visual-clicked="activeWindow = 'visual'"
          />
          <SpecklebotWindowChat v-if="activeWindow === 'chat'" />
          <SpecklebotWindowCompliance v-if="activeWindow === 'compliance'" />
          <SpecklebotWindowVersion v-if="activeWindow === 'version'" />
          <SpecklebotWindowVisual v-if="activeWindow === 'visual'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ModifierKeys, onKeyboardShortcut } from '@speckle/ui-components'
import { onKeyStroke } from '@vueuse/core'
import { XMarkIcon, ChevronLeftIcon } from '@heroicons/vue/20/solid'

const open = defineModel<boolean>('open')

const activeWindow = ref<'initial' | 'chat' | 'compliance' | 'version' | 'visual'>(
  'initial'
)

const closeWindow = () => {
  open.value = false
  resetStates()
}

const resetStates = () => {
  activeWindow.value = 'initial'
}

// Watch for changes in the 'open' state
watch(open, (newValue) => {
  if (!newValue) {
    resetStates()
  }
})

const toggleInput = () => {
  if (open.value) {
    closeWindow()
  } else {
    open.value = true
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
