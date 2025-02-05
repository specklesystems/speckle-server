<template>
  <div>
    <div class="relative">
      <button class="hidden sm:block pointer-events-auto group" @click="toggle(index)">
        <div
          v-show="!item.viewed"
          class="animate-ping absolute bg-primary rounded-full h-8 w-8"
        ></div>
        <div
          class="sm:absolute bg-foundation group-hover:scale-125 scale transition rounded-full h-8 w-8 flex items-center justify-center text-primary cursor-pointer select-none text-sm font-medium"
        >
          <span>{{ index + 1 }}</span>
          <!-- <span v-if="!expanded">{{ index + 1 }}</span>
          <span v-else><XMarkIcon class="h-6 w-6" /></span> -->
        </div>
      </button>
      <Transition
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
        enter-active-class="transition duration-300"
        leave-active-class="transition duration-300"
      >
        <div
          v-show="item.expanded"
          class="transition bg-foundation-page border border-outline-3 rounded-lg shadow-md mb-8 mx-2 gap-2 sm:gap-4 sm:ml-12 sm:max-w-xs pointer-events-auto"
        >
          <div
            class="sm:hidden flex items-center justify-center w-full gap-3 mt-1 mb-3"
          >
            <div
              class="bg-primary rounded-full"
              :class="index === 0 ? 'h-3 w-3' : 'h-2 w-2 opacity-50'"
            ></div>
            <div
              class="bg-primary rounded-full"
              :class="index === 1 ? 'h-3 w-3' : 'h-2 w-2 opacity-50'"
            ></div>
            <div
              class="bg-primary rounded-full"
              :class="index === 2 ? 'h-3 w-3' : 'h-2 w-2 opacity-50'"
            ></div>
          </div>

          <div class="px-6 py-4">
            <slot></slot>
          </div>

          <div
            class="flex items-center justify-between pointer-events-auto px-6 py-2 border-t border-outline-3"
          >
            <slot name="actions">
              <FormButton text size="sm" color="outline" @click="$emit('skip')">
                Skip
              </FormButton>
              <div class="flex justify-center items-center space-x-2">
                <FormButton
                  v-show="index !== 0"
                  size="sm"
                  color="outline"
                  text
                  @click="prev(index)"
                >
                  <ArrowLeftIcon class="h-3 w-3 mr-1" />
                  Previous
                </FormButton>
                <div v-if="index === 2">
                  <div v-if="!disableNext" v-tippy="'First add another model'">
                    <FormButton disabled>Finish</FormButton>
                  </div>
                  <FormButton v-else @click="$emit('skip')">Finish</FormButton>
                </div>
                <FormButton v-else :icon-right="ArrowRightIcon" @click="next(index)">
                  Next
                </FormButton>
              </div>
            </slot>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Vector3 } from 'three'
import { ArrowRightIcon, ArrowLeftIcon } from '@heroicons/vue/24/solid'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import type { SlideshowItem } from '~~/lib/tour/slideshowItems'

const { next, prev, toggle } = inject('slideshowActions') as {
  next: (currentIndex: number) => void
  prev: (currentIndex: number) => void
  toggle: (i: number) => void
}

defineEmits(['skip', 'previous', 'next'])

const props = defineProps<{
  index: number
  item: SlideshowItem
  disableNext: boolean
}>()

const {
  ui: {
    camera: { position, target }
  }
} = useInjectedViewerState()

watchEffect(() => {
  if (props.item.expanded) setView()
})

function setView() {
  const camPos = props.item.camPos
  position.value = new Vector3(camPos[0], camPos[1], camPos[2])
  target.value = new Vector3(camPos[3], camPos[4], camPos[5])
}
</script>
