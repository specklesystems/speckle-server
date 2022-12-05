<template>
  <div class="">
    <button class="pointer-events-auto" @click="commentClicked()">
      <div class="animate-ping absolute bg-primary rounded-full h-8 w-8"></div>
      <div
        class="absolute bg-foundation rounded-full h-8 w-8 flex items-center justify-center text-white cursor-pointer select-none text-sm font-bold"
      >
        <span v-if="!expanded">{{ index }}</span>
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
        class="pointer-events-auto rounded-lg bg-foundation text-white ml-10 px-4 py-4 max-w-sm min-w-fit shadow-xl space-y-4 w-96"
      >
        <h3 class="h3 font-bold">Welcome To Speckle!</h3>
        <p class="">
          Animations by their very nature tend to be highly project-specific. The
          animations we include by default are best thought of as helpful examples, and
          you’re encouraged to customize your animations to better suit your needs.
        </p>
        <div class="flex items-center justify-between">
          <FormButton type="link" foreground-link size="xs">Skip</FormButton>
          <FormButton>Next</FormButton>
        </div>
      </div>
    </Transition>
  </div>
</template>
<script setup lang="ts">
import { Viewer } from '@speckle/viewer'
import { Vector3 } from 'three'
import { XMarkIcon } from '@heroicons/vue/24/solid'

const props = defineProps({
  index: {
    type: Number,
    default: 0
  },
  camPos: {
    type: Array,
    default: () => [1, 1, 1, 1, 1, 1]
  }
})

const viewer = inject('viewer') as Viewer

const expanded = ref(false)
const commentClicked = () => {
  console.log(props.camPos)
  viewer.setView({
    position: new Vector3(props.camPos[0], props.camPos[1], props.camPos[2]),
    target: new Vector3(props.camPos[3], props.camPos[4], props.camPos[5])
  })
  expanded.value = !expanded.value
}
</script>
