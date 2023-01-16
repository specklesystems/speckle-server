<template>
  <div
    class="absolute h-screen pt-[4.5rem] px-2 flex flex-col space-y-2 bg-green-300/0"
  >
    <button
      :class="`${
        activeControl === 'models'
          ? 'bg-primary text-foreground-on-primary'
          : 'bg-foundation text-foreground'
      } transition shadow-md rounded-full w-10 h-10 flex items-center justify-center`"
      @click="toggleActiveControl('models')"
    >
      <CubeIcon v-if="activeControl !== 'models'" class="w-5 h-5" />
      <XMarkIcon v-else class="w-5 h-5" />
    </button>
    <button
      :class="`${
        activeControl === 'explorer'
          ? 'bg-primary text-foreground-primary'
          : 'bg-foundation text-foreground'
      } transition shadow-md rounded-full w-10 h-10 flex items-center justify-center`"
      @click="toggleActiveControl('explorer')"
    >
      <svg
        width="18"
        height="16"
        viewBox="0 0 18 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        :class="`${
          activeControl === 'explorer'
            ? 'stroke-foreground-on-primary'
            : 'stroke-foreground'
        }`"
      >
        <path
          d="M11.4998 3.75H12.2498V3V2.16667C12.2498 1.66177 12.6582 1.25 13.1665 1.25H15.6665C16.1714 1.25 16.5832 1.65832 16.5832 2.16667V5.5C16.5832 6.0049 16.1749 6.41667 15.6665 6.41667H13.1665C12.6641 6.41667 12.2498 6.00245 12.2498 5.5V4.66667V3.91667H11.4998H9.83317H9.08317V4.66667V10.5083C9.08317 11.3725 9.79396 12.0833 10.6582 12.0833H11.4998H12.2498V11.3333V10.5C12.2498 9.9951 12.6582 9.58333 13.1665 9.58333H15.6665C16.1714 9.58333 16.5832 9.99165 16.5832 10.5V13.8333C16.5832 14.3382 16.1749 14.75 15.6665 14.75H13.1665C12.6616 14.75 12.2498 14.3417 12.2498 13.8333V13V12.25H11.4998H10.6582C9.69738 12.25 8.9165 11.4691 8.9165 10.5083V4.66667V3.91667H8.1665H6.49984H5.74984V4.66667V5.5C5.74984 6.0049 5.34152 6.41667 4.83317 6.41667H2.33317C1.82827 6.41667 1.4165 6.00835 1.4165 5.5V2.16667C1.4165 1.66421 1.83072 1.25 2.33317 1.25H4.8415C5.3464 1.25 5.75817 1.65832 5.75817 2.16667V3V3.75H6.50817H11.4998Z"
        />
      </svg>
    </button>
    <button
      class="bg-foundation shadow-md rounded-full w-10 h-10 flex items-center justify-center"
      @click="toggleActiveControl('models')"
    >
      <FunnelIcon class="w-5 h-5" />
    </button>
    <button
      class="bg-foundation shadow-md rounded-full w-10 h-10 flex items-center justify-center"
      @click="toggleActiveControl('models')"
    >
      <ChatBubbleLeftRightIcon class="w-5 h-5" />
    </button>
  </div>
  <div
    :class="`absolute h-screen pt-[4.5rem] mx-14 mb-4 transition-[width,opacity] ease-in-out duration-75 overflow-hidden bg-lime-300/0 overflow-y-auto ${
      activeControl !== 'none' ? 'w-80 opacity-100' : 'w-0 opacity-0'
    }`"
  >
    <ViewerResourcesList v-show="activeControl === 'models'" />
    <ViewerResourcesExplorer v-show="activeControl === 'explorer'" />
    <ViewerCommentsList v-show="activeControl === 'comments'" />
  </div>
</template>
<script setup lang="ts">
import {
  CubeIcon,
  FunnelIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

type ActiveControl = 'none' | 'models' | 'explorer' | 'filters' | 'comments'

const activeControl = ref<ActiveControl>('models')
const toggleActiveControl = (control: ActiveControl) =>
  activeControl.value === control
    ? (activeControl.value = 'none')
    : (activeControl.value = control)
</script>
