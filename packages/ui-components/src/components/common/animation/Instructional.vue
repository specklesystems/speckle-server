<template>
  <div
    class="relative aspect-square w-full h-full max-w-[250px] mx-auto mb-8 border-t border-r border-outline-3 select-none"
  >
    <div
      class="absolute z-50 text-foreground dark:text-foundation"
      :style="{
        transitionProperty: 'all',
        top: mousePosition.top + '%',
        left: mousePosition.left + '%',
        transitionDuration: animationDuration + 'ms'
      }"
    >
      <ClickIcon
        class="absolute -top-5 -left-4 h-12 w-12 -rotate-12 text-foreground"
        :class="[{ hidden: !isClicked }]"
      />
      <MouseIcon class="absolute inset-0 h-11 w-11" />
    </div>
    <div class="w-full h-full overflow-hidden">
      <slot name="background"></slot>
      <template v-if="slotVisibility.slot1">
        <slot name="slot1"></slot>
      </template>
      <template v-if="slotVisibility.slot2">
        <slot name="slot2"></slot>
      </template>
      <template v-if="slotVisibility.slot3">
        <slot name="slot3"></slot>
      </template>
      <template v-if="slotVisibility.slot4">
        <slot name="slot4"></slot>
      </template>
      <template v-if="slotVisibility.slot5">
        <slot name="slot5"></slot>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, type PropType, onBeforeUnmount } from 'vue'
import MouseIcon from '~~/src/components/common/animation/MouseIcon.vue'
import ClickIcon from '~~/src/components/common/animation/ClickIcon.vue'

type AnimationAction = {
  type: 'animation'
  top: number
  left: number
  duration: number
}

type ClickAction = {
  type: 'click'
}

type DelayAction = {
  type: 'delay'
  duration: number
}

type SlotKey = 'slot1' | 'slot2' | 'slot3' | 'slot4' | 'slot5'

type SlotAction = {
  type: 'slot'
  slot: SlotKey
}

type Action = AnimationAction | ClickAction | SlotAction | DelayAction

const props = defineProps({
  actions: Array as PropType<Action[]>,
  initialPosition: {
    type: Object as PropType<{ top: number; left: number }>
  }
})

const isAnimating = ref(true)
const mousePosition = ref({ ...props.initialPosition })
const isClicked = ref(false)
const animationDuration = ref(500)
const isMouseVisible = ref(true)
const slotVisibility = ref({
  slot1: false,
  slot2: false,
  slot3: false,
  slot4: false,
  slot5: false
})

function delay(action: DelayAction) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, action.duration)
  })
}

function toggleSlotVisibility(action: SlotAction) {
  const slotKey: SlotKey = action.slot
  slotVisibility.value[slotKey] = !slotVisibility.value[slotKey]
}

async function handleAction(action: Action) {
  switch (action.type) {
    case 'animation':
      mousePosition.value = { top: action.top, left: action.left }
      animationDuration.value = action.duration
      break
    case 'click':
      isClicked.value = true
      setTimeout(() => (isClicked.value = false), 500)
      break
    case 'delay':
      return delay(action)
    case 'slot':
      toggleSlotVisibility(action as SlotAction)
      break
  }
}

onMounted(() => {
  const loopActions = async () => {
    while (isAnimating.value) {
      isMouseVisible.value = true
      for (const action of props.actions || []) {
        await handleAction(action)
      }
      isMouseVisible.value = false
      mousePosition.value = { ...props.initialPosition }
    }
  }

  loopActions()
})

onBeforeUnmount(() => {
  isAnimating.value = false
})
</script>
