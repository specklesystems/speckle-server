<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="hidden layout-container rounded-2xl md:flex justify-between items-center">
    <div class="grid grid-cols-5 gap-2">
      <div v-for="(step, idx) in steps" :key="idx" class="py-2 col-span-1">
        <div
          :class="`${
            step.active
              ? 'bg-foundation-2 shadow hover:shadow-md'
              : 'text-foreground-2 hover:bg-primary-muted'
          } transition rounded-md flex flex-col px-2 py-1 cursor-pointer`"
          @click.stop="activateStep(idx)"
        >
          <div
            :class="`text-3xl  flex items-center justify-between ${
              step.active ? 'text-primary' : 'text-foreground-2'
            }`"
          >
            <span>{{ idx + 1 }}</span>
            <Component :is="step.icon" v-if="!step.completed" :class="`w-4 h-4 mt-1`" />
            <CheckCircleIcon v-else class="w-4 h-4 mt-1" />
          </div>
          <div :class="`${step.active ? 'font-bold text-primary' : ''}`">
            {{ step.title }}
          </div>
          <div class="text-xs mt-[2px]">{{ step.blurb }}</div>
          <div class="flex justify-between items-center py-2">
            <FormButton
              v-if="!step.completed"
              size="sm"
              :disabled="!step.active"
              @click.stop="step.action"
            >
              Let's go!
            </FormButton>

            <FormButton
              v-if="step.active && idx !== steps.length - 1 && !step.completed"
              text
              link
              size="xs"
              color="card"
              @click.stop="markComplete(idx)"
            >
              Mark as complete
            </FormButton>
            <FormButton v-if="step.completed" text link size="xs">
              Completed!
            </FormButton>
          </div>
        </div>
      </div>
      <div class="flex items-center justify-end">
        <FormButton v-if="!allCompleted" text size="sm">Dismiss</FormButton>
        <div v-else>
          <FormButton text size="sm">Close Checklist</FormButton>
        </div>
      </div>
    </div>
    <TourManager
      v-show="showManagerDownloadDialog"
      :allow-escape="false"
      @close=";(showManagerDownloadDialog = false), markComplete(0)"
    >
      <template #header>Download Manager</template>
    </TourManager>
  </div>
</template>
<script setup lang="ts">
import {
  CheckCircleIcon,
  ShareIcon,
  ComputerDesktopIcon,
  UserPlusIcon,
  CloudArrowUpIcon,
  HeartIcon
} from '@heroicons/vue/24/solid'
import { useSynchronizedCookie } from '~~/lib/common/composables/reactiveCookie'

const showManagerDownloadDialog = ref(false)
const hasDownloadedManager = useSynchronizedCookie<boolean>(`hasDownloadedManager`)

const steps = ref([
  {
    title: 'Get Connectors',
    blurb:
      'Use Manager to install the Speckle Connectors for your design applications!',
    active: false,
    action: () => {
      showManagerDownloadDialog.value = true
    },
    completed: hasDownloadedManager.value,
    icon: ComputerDesktopIcon
  },
  {
    title: 'Link Account',
    blurb: 'Authorise our application connectors to send data to Speckle.',
    active: false,
    action: () => {
      //TODO
    },
    completed: false,
    icon: UserPlusIcon
  },
  {
    title: 'Send your first model',
    blurb: 'Use your favourite design app to send your first model to Speckle.',
    active: false,
    action: () => {
      //TODO
    },
    completed: false,
    icon: CloudArrowUpIcon
  },
  {
    title: 'Share your model!',
    blurb: 'Create an account on our community forum and share your model!',
    active: false,
    action: () => {
      //TODO
    },
    completed: false,
    icon: ShareIcon
  }
])

const activateStep = (idx: number) => {
  steps.value.forEach((s, index) => (s.active = idx === index))
}

const markComplete = (idx: number) => {
  steps.value[idx].completed = true
  steps.value[idx].active = false
  activateStep(idx + 1)
}

const allCompleted = computed(() => steps.value.every((step) => step.completed))

// Open up first non-completed step
const firstNonCompleteStepIndex = steps.value.findIndex((s) => !!s.completed) + 1
activateStep(firstNonCompleteStepIndex)
</script>
