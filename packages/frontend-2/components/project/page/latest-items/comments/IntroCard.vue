<template>
  <div :class="['p-4', 'flex flex-col justify-center items-center gap-2 sm:gap-6']">
    <div
      :class="`hidden sm:block w-42 h-42 group transition-[margin-right] mr-0 hover:sm:mr-12 ${
        small ? 'scale-75' : ''
      }`"
    >
      <template v-if="!isDarkTheme">
        <img
          src="~~/assets/images/discussions/d-w-1.png"
          class="opacity-80 w-36 h-auto shadow-md relative transition grayscale blur-[1px] group-hover:blur-[2px] group-hover:sm:grayscale-0 group-hover:sm:-translate-x-10 group-hover:sm:-translate-y-3 group-hover:sm:scale-105"
          alt="discussions image"
        />
        <img
          src="~~/assets/images/discussions/d-w-2.png"
          class="w-36 shadow-md relative ml-10 -mt-20 transition grayscale group-hover:sm:grayscale-0 group-hover:sm:translate-x-5 group-hover:sm:scale-150 group-hover:sm:shadow-xl"
          alt="discussions image"
        />
      </template>
      <template v-else>
        <img
          src="~~/assets/images/discussions/d-d-1.png"
          class="opacity-80 w-36 h-auto shadow-md relative transition grayscale blur-[1px] group-hover:blur-[2px] group-hover:grayscale-0 group-hover:-translate-x-10 group-hover:-translate-y-3 group-hover:scale-105"
          alt="discussions image"
        />
        <img
          src="~~/assets/images/discussions/d-d-2.png"
          class="w-36 shadow-md relative ml-10 -mt-20 transition grayscale group-hover:grayscale-0 group-hover:translate-x-5 group-hover:scale-150 group-hover:shadow-xl"
          alt="discussions image"
        />
      </template>
    </div>
    <div class="text-foreground text-center text-xs sm:text-sm">
      <div>Speckle allows for real time discussions straight in your 3D model.</div>
      <div v-if="!small" class="text-xs text-foreground-2">
        Head over to a model and start coordinating right away!
      </div>
      <div v-else class="mt-3">
        <FormButton
          v-if="embedOptions?.isEnabled"
          size="sm"
          :icon-right="ArrowTopRightOnSquareIcon"
          :to="route.path"
          external
          target="_blank"
        >
          Discuss in Speckle
        </FormButton>
        <FormButton
          v-else
          size="sm"
          :icon-left="PlusIcon"
          @click="() => $emit('new-discussion')"
        >
          New discussion
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PlusIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useTheme } from '~~/lib/core/composables/theme'

defineEmits<{
  (e: 'new-discussion'): void
}>()

withDefaults(
  defineProps<{
    small?: boolean
  }>(),
  {
    small: false
  }
)

const {
  urlHashState: { embedOptions }
} = useInjectedViewerState()

const { isDarkTheme } = useTheme()

const route = useRoute()
</script>
