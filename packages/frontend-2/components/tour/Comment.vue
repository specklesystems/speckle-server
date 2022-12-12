<template>
  <div class="">
    <button class="pointer-events-auto group" @click="toggleComment()">
      <div class="animate-ping absolute bg-primary rounded-full h-8 w-8"></div>
      <div
        class="absolute bg-foundation dark:bg-foreground group-hover:scale-125 scale transition rounded-full h-8 w-8 flex items-center justify-center text-primary cursor-pointer select-none text-sm font-bold"
      >
        <span v-if="!expanded">{{ index + 1 }}</span>
        <span v-else><XMarkIcon class="h-6 w-6" /></span>
      </div>
    </button>
    <Transition
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      enter-active-class="transition duration-300"
      leave-active-class="transition duration-300"
    >
      <div
        v-show="expanded"
        class="rounded-lg backdrop-blur-sm bg-white/80 dark:text-foundation ml-10 px-4 py-4 max-w-xs min-w-fit shadow-md space-y-4 w-96"
      >
        <slot>Pasta</slot>

        <div class="flex items-center justify-between pointer-events-auto">
          <slot name="actions">
            <FormButton text outlined size="sm" to="/">Skip</FormButton>
            <div class="flex justify-center space-x-2">
              <FormButton
                v-show="index !== 0"
                :icon-left="ArrowLeftIcon"
                text
                size="sm"
                @click="commentState--"
              >
                Previous
              </FormButton>
              <FormButton
                :icon-right="ArrowRightIcon"
                size="sm"
                @click="commentState++"
              >
                Next
              </FormButton>
            </div>
          </slot>
        </div>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { Viewer } from '@speckle/viewer'
import { Vector3 } from 'three'
import { XMarkIcon, ArrowRightIcon, ArrowLeftIcon } from '@heroicons/vue/24/solid'
import type { Ref } from 'vue'

const commentState = inject('commentState') as Ref<number>
const locations = inject('locations') as { camPos: number[] }[]

const props = defineProps({
  index: {
    type: Number,
    default: 0
  }
})

const viewer = inject('viewer') as Viewer

const expanded = computed(() => {
  return commentState.value === props.index
})

watchEffect(() => {
  if (expanded.value) setView()
})

function toggleComment() {
  if (expanded.value) commentState.value = -1
  else {
    commentState.value = props.index
  }
}

function setView() {
  const camPos = locations[props.index].camPos
  viewer.setView({
    position: new Vector3(camPos[0], camPos[1], camPos[2]),
    target: new Vector3(camPos[3], camPos[4], camPos[5])
  })
}
</script>
