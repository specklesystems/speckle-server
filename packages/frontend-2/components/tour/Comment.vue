<template>
  <div class="">
    <button class="pointer-events-auto group" @click="commentClicked()">
      <div class="animate-ping absolute bg-primary rounded-full h-8 w-8"></div>
      <div
        class="absolute bg-white/80 group-hover:scale-125 scale transition rounded-full h-8 w-8 flex items-center justify-center text-primary cursor-pointer select-none text-sm font-bold"
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
            <FormButton text outlined size="sm">Skip</FormButton>
            <div class="flex justify-center space-x-2">
              <FormButton
                v-show="index !== 0"
                :icon-left="ArrowLeftIcon"
                text
                size="sm"
                @click="$emit('next', index - 1), (expanded = false)"
              >
                Previous
              </FormButton>
              <FormButton
                :icon-right="ArrowRightIcon"
                size="sm"
                @click="$emit('next', index + 1), (expanded = false)"
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

const commentState = inject('commentState')

const props = defineProps({
  index: {
    type: Number,
    default: 0
  },
  expandedIndex: {
    type: Number,
    required: true
  },
  camPos: {
    type: Array,
    default: () => [1, 1, 1, 1, 1, 1]
  },
  expand: { type: Boolean, default: false }
})

const viewer = inject('viewer') as Viewer

const expanded = ref(false)

watch(props, (newVal, oldVal) => {
  console.log(newVal.expand)
  if (newVal.expand) commentClicked()
})

const commentClicked = () => {
  expanded.value = !expanded.value
  if (expanded.value)
    viewer.setView({
      position: new Vector3(props.camPos[0], props.camPos[1], props.camPos[2]),
      target: new Vector3(props.camPos[3], props.camPos[4], props.camPos[5])
    })
}

onMounted(() => {
  if (props.expand === true)
    //expanded.value = true
    commentClicked()
})
</script>
